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
import { Loader2, Clock } from 'lucide-react';

interface StageDetailProps {
  matter: Matter;
  activeStage: StageInfo;
}

const STAGE_DESCRIPTIONS: Record<StageId, string> = {
  intake: 'Document scoped and validated. Jurisdiction, document type, and analysis parameters confirmed.',
  parsing: 'Extracting clauses, structural sections, and key provisions from the document.',
  issue_analysis: 'Each clause evaluated against legal best practices and market standards.',
  research: 'Parallel research agents analyze market norms, risk impacts, and negotiation leverage.',
  synthesis: 'Research findings synthesized into actionable recommendations with confidence scores.',
  drafting: 'Specific redline language drafted for each issue with suggested contract changes.',
  adversarial_review: 'Independent review agent challenges assumptions and stress-tests recommendations.',
  guardrails: 'Final safety checks — jurisdiction compliance, citation verification, and confidence thresholds.',
  deliverables: 'Analysis artifacts packaged into downloadable deliverables.',
};

export default function StageDetail({ matter, activeStage }: StageDetailProps) {
  const renderStageContent = () => {
    if (activeStage.status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
          <h3 className="text-sm font-medium text-gray-400">Waiting for previous stages</h3>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs">
            This stage will begin automatically once upstream stages complete.
          </p>
        </div>
      );
    }

    if (activeStage.status === 'running' && !activeStage.data) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {activeStage.label}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-sm leading-relaxed">
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

  const elapsed =
    activeStage.startedAt && activeStage.completedAt
      ? (
          (new Date(activeStage.completedAt).getTime() -
            new Date(activeStage.startedAt).getTime()) /
          1000
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Stage Header */}
      <div className="mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
              activeStage.status === 'running'
                ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                : activeStage.status === 'complete'
                  ? 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200'
                  : activeStage.status === 'warning'
                    ? 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200'
                    : 'bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200'
            }`}
          >
            {activeStage.status === 'running' ? (
              <>
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                In progress
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
            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
          {activeStage.label}
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-2xl">
          {STAGE_DESCRIPTIONS[activeStage.id]}
        </p>
      </div>

      {/* Stage Content */}
      {renderStageContent()}
    </div>
  );
}
