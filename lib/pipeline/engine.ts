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

export async function runPipeline(matterId: string): Promise<void> {
  console.log(`🚀 Pipeline started for matter ${matterId}`);
  const pipelineStart = Date.now();

  for (const stageId of STAGE_ORDER) {
    let matter = await getMatter(matterId);
    if (!matter) {
      console.error(`Matter ${matterId} not found, aborting pipeline`);
      return;
    }

    // Mark stage as running
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

      // Re-fetch in case it was updated during execution
      matter = await getMatter(matterId);
      if (!matter) return;

      // Apply updates
      matter = { ...matter, ...updates };

      // Mark stage complete — preserve stage-specific data if the stage set it
      const stageStatus =
        stageId === 'guardrails' && matter.guardrails?.escalationRequired
          ? ('warning' as const)
          : ('complete' as const);

      const stageDuration = Date.now() - stageStart;

      // Check if the stage already set its own data (via its returned stages array)
      const existingStageData = matter.stages.find((s) => s.id === stageId)?.data;

      // Build stage summary data for stages that don't set their own data
      let finalStageData = existingStageData;
      if (!finalStageData) {
        // Create meaningful data summaries for each stage type
        switch (stageId) {
          case 'parsing':
            finalStageData = {
              sectionCount: matter.parsedSections?.length || 0,
              totalClauses: matter.parsedSections?.reduce((sum, s) => sum + (s.clauseCount || 0), 0) || 0,
              sections: matter.parsedSections,
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
      console.log(`✅ Stage ${stageId} completed in ${(stageDuration / 1000).toFixed(1)}s`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Stage ${stageId} failed:`, errorMsg);

      matter = await getMatter(matterId);
      if (!matter) return;

      matter = updateStage(matter, stageId, {
        status: 'blocked',
        completedAt: new Date().toISOString(),
      });
      matter = addAuditEntry(matter, stageId, 'error', `Stage ${stageId} failed: ${errorMsg}`);
      matter.status = 'error';
      await setMatter(matter);
      return;
    }
  }

  // Mark pipeline complete
  const matter = await getMatter(matterId);
  if (matter) {
    matter.currentStage = null;
    matter.status = 'complete';
    const totalTime = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    matter.auditLog.push({
      timestamp: new Date().toISOString(),
      stage: 'deliverables',
      action: 'pipeline_complete',
      detail: `Full pipeline completed in ${totalTime}s`,
    });
    await setMatter(matter);
    console.log(`🏁 Pipeline complete for matter ${matterId} in ${totalTime}s`);
  }
}
