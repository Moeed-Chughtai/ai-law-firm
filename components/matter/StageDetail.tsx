'use client';

import { Matter, StageInfo } from '@/lib/types';
import IntakeStage from './stages/IntakeStage';
import ParsingStage from './stages/ParsingStage';
import IssueAnalysisStage from './stages/IssueAnalysisStage';
import ResearchStage from './stages/ResearchStage';
import SynthesisStage from './stages/SynthesisStage';
import DraftingStage from './stages/DraftingStage';
import AdversarialReviewStage from './stages/AdversarialReviewStage';
import GuardrailsStage from './stages/GuardrailsStage';
import DeliverablesStage from './stages/DeliverablesStage';
import { Loader2 } from 'lucide-react';

interface StageDetailProps {
  matter: Matter;
  activeStage: StageInfo;
}

export default function StageDetail({ matter, activeStage }: StageDetailProps) {
  const renderStageContent = () => {
    if (activeStage.status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-surface-300" />
          </div>
          <h3 className="text-sm font-medium text-gray-400">Stage Pending</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            This stage will begin once the preceding stages have completed.
          </p>
        </div>
      );
    }

    if (activeStage.status === 'running' && !activeStage.data) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
          <h3 className="text-sm font-semibold text-brand-700">
            {activeStage.label}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Processing...</p>
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

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Stage Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              activeStage.status === 'running'
                ? 'bg-brand-50 text-brand-600'
                : activeStage.status === 'complete'
                  ? 'bg-emerald-50 text-emerald-600'
                  : activeStage.status === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-surface-100 text-gray-400'
            }`}
          >
            {activeStage.status === 'running' ? (
              <>
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
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
          {activeStage.completedAt && (
            <span className="text-[10px] text-gray-400">
              {new Date(activeStage.completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {activeStage.label}
        </h2>
      </div>

      {/* Stage Content */}
      {renderStageContent()}
    </div>
  );
}
