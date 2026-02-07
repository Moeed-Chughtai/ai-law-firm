import { Matter, StageId, StageInfo } from '../types';
import { getMatter, setMatter } from '../store';
import { sleep } from '../utils';
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
  for (const stageId of STAGE_ORDER) {
    let matter = await getMatter(matterId);
    if (!matter) return;

    // Mark stage as running
    matter = updateStage(matter, stageId, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    matter.currentStage = stageId;
    matter = addAuditEntry(matter, stageId, 'started', `Stage ${stageId} started`);
    await setMatter(matter);

    // Small delay to make the UI feel realistic
    await sleep(300);

    try {
      const runner = STAGE_RUNNERS[stageId];
      const updates = await runner(matter);

      // Re-fetch matter in case it was updated during stage execution
      matter = await getMatter(matterId);
      if (!matter) return;
      
      // Apply updates
      matter = { ...matter, ...updates };
      
      // Mark stage complete
      const stageStatus = stageId === 'guardrails' && matter.guardrails?.escalationRequired
        ? 'warning' as const
        : 'complete' as const;
      
      matter = updateStage(matter, stageId, {
        status: stageStatus,
        completedAt: new Date().toISOString(),
        data: updates,
      });
      matter = addAuditEntry(matter, stageId, 'completed', `Stage ${stageId} completed`);
      await setMatter(matter);
    } catch (error) {
      matter = await getMatter(matterId);
      if (!matter) return;
      
      matter = updateStage(matter, stageId, {
        status: 'blocked',
        completedAt: new Date().toISOString(),
      });
      matter = addAuditEntry(
        matter,
        stageId,
        'error',
        `Stage ${stageId} failed: ${error instanceof Error ? error.message : String(error)}`
      );
      matter.status = 'error';
      await setMatter(matter);
      return;
    }
  }

  // Mark pipeline as complete
  const matter = await getMatter(matterId);
  if (matter) {
    matter.currentStage = null;
    matter.status = 'complete';
    await setMatter(matter);
  }
}
