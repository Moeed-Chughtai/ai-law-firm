import { Matter, StageId, StageInfo } from '../types';
import { getMatter, setMatter } from '../store';
import { runIntake } from './stages/intake';
import { runParsing } from './stages/parsing';
import { runIssueAnalysis } from './stages/issueAnalysis';
import { runResearch } from './stages/research';
import { runSynthesis } from './stages/synthesis';
import { runDrafting } from './stages/drafting';
import { runAdversarialReview } from './stages/adversarialReview';
import { runGuardrails } from './stages/guardrails';
import { runFinalize } from './stages/finalize';

const STAGE_ORDER: StageId[] = [
  'intake',
  'parsing',
  'issue_analysis',
  'research',
  'synthesis',
  'drafting',
  'adversarial_review',
  'guardrails',
  'deliverables',
];

const STAGE_RUNNERS: Record<StageId, (matter: Matter) => Promise<Partial<Matter>>> = {
  intake: runIntake,
  parsing: runParsing,
  issue_analysis: runIssueAnalysis,
  research: runResearch,
  synthesis: runSynthesis,
  drafting: runDrafting,
  adversarial_review: runAdversarialReview,
  guardrails: runGuardrails,
  deliverables: runFinalize,
};

const MAX_ADVERSARIAL_LOOPS = 2;

function updateStage(matter: Matter, stageId: StageId, updates: Partial<StageInfo>): Matter {
  const stages = matter.stages.map((s) =>
    s.id === stageId ? { ...s, ...updates } : s
  );
  return { ...matter, stages };
}

function addAuditEntry(matter: Matter, stage: StageId, action: string, detail: string): Matter {
  return {
    ...matter,
    auditLog: [
      ...matter.auditLog,
      { timestamp: new Date().toISOString(), stage, action, detail },
    ],
  };
}

async function runStage(matterId: string, stageId: StageId): Promise<boolean> {
  let matter = await getMatter(matterId);
  if (!matter) {
    console.error(`Matter ${matterId} not found, aborting stage ${stageId}`);
    return false;
  }

  const stageStart = Date.now();
  matter = updateStage(matter, stageId, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });
  matter.currentStage = stageId;
  matter = addAuditEntry(matter, stageId, 'started', `Stage ${stageId} started`);
  await setMatter(matter);

  try {
    const runner = STAGE_RUNNERS[stageId];
    const updates = await runner(matter);

    matter = await getMatter(matterId);
    if (!matter) return false;

    matter = { ...matter, ...updates };

    const stageStatus =
      stageId === 'guardrails' && matter.guardrails?.escalationRequired
        ? ('warning' as const)
        : ('complete' as const);

    const stageDuration = Date.now() - stageStart;

    const existingStageData = matter.stages.find((s) => s.id === stageId)?.data;
    let finalStageData = existingStageData;
    if (!finalStageData) {
      switch (stageId) {
        case 'parsing':
          finalStageData = {
            sectionCount: matter.parsedSections?.length || 0,
            totalClauses: matter.parsedSections?.reduce((sum, s) => sum + (s.clauseCount || 0), 0) || 0,
            sections: matter.parsedSections,
            definedTerms: matter.definedTerms || [],
            missingProvisions: matter.missingProvisions || [],
          };
          break;
        case 'issue_analysis':
          finalStageData = {
            issuesFound: matter.issues?.length || 0,
            issues: matter.issues,
          };
          break;
        case 'research':
          finalStageData = {
            issuesResearched: matter.issues?.filter((i) => i.research).length || 0,
            totalIssues: matter.issues?.length || 0,
          };
          break;
        case 'synthesis':
          finalStageData = {
            issuesSynthesized: matter.issues?.filter((i) => i.synthesis).length || 0,
            totalIssues: matter.issues?.length || 0,
          };
          break;
        case 'drafting':
          finalStageData = {
            redlinesGenerated: matter.issues?.filter((i) => i.redline).length || 0,
            totalIssues: matter.issues?.length || 0,
          };
          break;
        case 'adversarial_review':
          finalStageData = {
            critiques: matter.adversarialCritiques?.length || 0,
            draftRevised: matter.draftRevised,
            loopCount: matter.adversarialLoopCount || 0,
          };
          break;
        default:
          finalStageData = { completed: true };
      }
    }

    matter = updateStage(matter, stageId, {
      status: stageStatus,
      completedAt: new Date().toISOString(),
      data: finalStageData,
    });
    matter = addAuditEntry(
      matter,
      stageId,
      'completed',
      `Stage ${stageId} completed in ${(stageDuration / 1000).toFixed(1)}s`
    );
    await setMatter(matter);
    console.log(`Stage ${stageId} completed in ${(stageDuration / 1000).toFixed(1)}s`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Stage ${stageId} failed:`, errorMsg);

    matter = await getMatter(matterId);
    if (!matter) return false;

    matter = updateStage(matter, stageId, {
      status: 'blocked',
      completedAt: new Date().toISOString(),
    });
    matter = addAuditEntry(matter, stageId, 'error', `Stage ${stageId} failed: ${errorMsg}`);
    matter.status = 'error';
    await setMatter(matter);
    return false;
  }
}

export async function runPipeline(matterId: string): Promise<void> {
  console.log(`Pipeline started for matter ${matterId}`);
  const pipelineStart = Date.now();

  for (const stageId of STAGE_ORDER) {
    const success = await runStage(matterId, stageId);
    if (!success) return;

    if (stageId === 'adversarial_review') {
      let matter = await getMatter(matterId);
      if (!matter) return;

      while (
        matter.draftRevised &&
        (matter.adversarialLoopCount || 0) < MAX_ADVERSARIAL_LOOPS
      ) {
        const loopNum = (matter.adversarialLoopCount || 0) + 1;
        console.log(`Adversarial loopback #${loopNum} — re-running drafting and review`);

        matter.adversarialLoopCount = loopNum;
        matter = addAuditEntry(
          matter,
          'adversarial_review',
          'loopback',
          `Adversarial review flagged material issues — initiating revision loop #${loopNum} (max ${MAX_ADVERSARIAL_LOOPS}). Reason: ${matter.adversarialCritiques?.slice(0, 2).join('; ') || 'Material errors detected'}`
        );
        await setMatter(matter);

        const draftSuccess = await runStage(matterId, 'drafting');
        if (!draftSuccess) return;

        const reviewSuccess = await runStage(matterId, 'adversarial_review');
        if (!reviewSuccess) return;

        matter = await getMatter(matterId);
        if (!matter) return;
      }

      if (matter.draftRevised && (matter.adversarialLoopCount || 0) >= MAX_ADVERSARIAL_LOOPS) {
        console.log(`Maximum adversarial loops (${MAX_ADVERSARIAL_LOOPS}) reached — proceeding with escalation flag`);
        matter = addAuditEntry(
          matter,
          'adversarial_review',
          'max_loops_reached',
          `Maximum revision loops reached (${MAX_ADVERSARIAL_LOOPS}). Unresolved concerns will be flagged in guardrails for human review.`
        );
        await setMatter(matter);
      }
    }
  }

  const matter = await getMatter(matterId);
  if (matter) {
    matter.currentStage = null;
    matter.status = 'complete';
    const totalTime = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    matter.auditLog.push({
      timestamp: new Date().toISOString(),
      stage: 'deliverables',
      action: 'pipeline_complete',
      detail: `Full pipeline completed in ${totalTime}s${matter.adversarialLoopCount ? ` (${matter.adversarialLoopCount} revision loop(s) performed)` : ''}`,
    });
    await setMatter(matter);
    console.log(`Pipeline complete for matter ${matterId} in ${totalTime}s`);
  }
}
