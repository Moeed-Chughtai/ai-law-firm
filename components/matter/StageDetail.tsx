'use client';

import { Matter, StageInfo, StageId } from '@/lib/types';
import IntakeStage from './stages/IntakeStage';
import ParsingStage from './stages/ParsingStage';
import IssueAnalysisStage from './stages/IssueAnalysisStage';
import ResearchStage from './stages/ResearchStage';
import SynthesisStage from './stages/SynthesisStage';
import DraftingStage from './stages/DraftingStage';
import AdversarialReviewStage from './stages/AdversarialReviewStage';
import GuardrailsStage from './stages/GuardrailsStage';
import DeliverablesStage from './stages/DeliverablesStage';
import { Loader2, Clock, ArrowRight } from 'lucide-react';

interface StageDetailProps {
  matter: Matter;
  activeStage: StageInfo;
}

const STAGE_DESCRIPTIONS: Record<StageId, string> = {
  intake: 'Your document is scoped and validated for review. We verify jurisdiction, document type, and set the analysis parameters.',
  parsing: 'The document is broken down into its constituent clauses and structural sections for systematic analysis.',
  issue_analysis: 'Each clause is examined against legal best practices and market standards to identify risks, gaps, and areas of concern.',
  research: 'Specialized research agents work in parallel — analyzing market norms, risk impacts, and negotiation leverage for each flagged issue.',
  synthesis: 'Research findings are synthesized into actionable legal recommendations with confidence scores and detailed reasoning.',
  drafting: 'Specific redline language is drafted for each issue, providing exact suggested changes to strengthen your position.',
  adversarial_review: 'An independent review agent challenges our analysis, testing assumptions and strengthening recommendations before delivery.',
  guardrails: 'Final safety checks verify jurisdiction compliance, citation completeness, and confidence thresholds before release.',
  deliverables: 'All analysis artifacts are packaged into downloadable deliverables — your complete legal review.',
};

export default function StageDetail({ matter, activeStage }: StageDetailProps) {
  const renderStageContent = () => {
    if (activeStage.status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
          </div>
          <h3 className="text-base font-medium text-slate-400 font-serif">Awaiting Previous Stages</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
            This stage will begin automatically once the preceding stages have completed their analysis.
          </p>
          <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Pipeline is sequential — each stage builds on the last</span>
          </div>
        </div>
      );
    }

    if (activeStage.status === 'running' && !activeStage.data) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-slate-900/20 animate-ping" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 font-serif mt-2">
            {activeStage.label}
          </h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
            {STAGE_DESCRIPTIONS[activeStage.id]}
          </p>
        </div>
      );
    }

    switch (activeStage.id) {
      case 'intake':
        return <IntakeStage matter={matter} stage={activeStage} />;
      case 'parsing':
        return <ParsingStage matter={matter} stage={activeStage} />;
      case 'issue_analysis':
        return <IssueAnalysisStage matter={matter} stage={activeStage} />;
      case 'research':
        return <ResearchStage matter={matter} stage={activeStage} />;
      case 'synthesis':
        return <SynthesisStage matter={matter} stage={activeStage} />;
      case 'drafting':
        return <DraftingStage matter={matter} stage={activeStage} />;
      case 'adversarial_review':
        return <AdversarialReviewStage matter={matter} stage={activeStage} />;
      case 'guardrails':
        return <GuardrailsStage matter={matter} stage={activeStage} />;
      case 'deliverables':
        return <DeliverablesStage matter={matter} stage={activeStage} />;
      default:
        return null;
    }
  };

  const elapsed = activeStage.startedAt && activeStage.completedAt
    ? ((new Date(activeStage.completedAt).getTime() - new Date(activeStage.startedAt).getTime()) / 1000).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Stage Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest ${
              activeStage.status === 'running'
                ? 'bg-slate-900 text-white'
                : activeStage.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700'
                  : activeStage.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-400'
            }`}
          >
            {activeStage.status === 'running' ? (
              <>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                In Progress
              </>
            ) : activeStage.status === 'complete' ? (
              'Complete'
            ) : activeStage.status === 'warning' ? (
              'Warning'
            ) : (
              activeStage.status
            )}
          </span>
          {elapsed && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
          )}
        </div>
        <h2 className="text-3xl font-serif text-slate-900 tracking-tight">
          {activeStage.label}
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">
          {STAGE_DESCRIPTIONS[activeStage.id]}
        </p>
      </div>

      {/* Stage Content */}
      {renderStageContent()}
    </div>
  );
}
