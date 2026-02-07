'use client';

import { StageId, StageInfo } from '@/lib/types';
import {
  ClipboardCheck,
  FileSearch,
  AlertCircle,
  Search,
  Brain,
  PenTool,
  ShieldCheck,
  Lock,
  Package,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const STAGE_LABELS: Record<StageId, string> = {
  intake: 'Intake',
  parsing: 'Parsing',
  issue_analysis: 'Issue analysis',
  research: 'Research',
  synthesis: 'Synthesis',
  drafting: 'Drafting',
  adversarial_review: 'Adversarial review',
  guardrails: 'Guardrails',
  deliverables: 'Deliverables',
};

interface TimelineProps {
  stages: StageInfo[];
  currentStage: StageId | null;
  selectedStage: StageId;
  onSelectStage: (stageId: StageId) => void;
}

export default function Timeline({
  stages,
  currentStage,
  selectedStage,
  onSelectStage,
}: TimelineProps) {
  const completedCount = stages.filter(
    (s) => s.status === 'complete' || s.status === 'warning'
  ).length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="section-label">Pipeline</span>
        <span className="text-xs text-gray-400 font-mono">{completedCount}/{stages.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mx-1 mb-5 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(completedCount / stages.length) * 100}%` }}
        />
      </div>

      {/* Stage list */}
      <div className="relative space-y-0.5">
        {stages.map((stage, index) => {
          const isSelected = selectedStage === stage.id;
          const isActive = stage.status === 'running';
          const isCompleted = stage.status === 'complete' || stage.status === 'warning';

          const elapsed =
            stage.completedAt && stage.startedAt
              ? ((new Date(stage.completedAt).getTime() -
                  new Date(stage.startedAt).getTime()) /
                  1000).toFixed(1)
              : null;

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-100 text-left group ${
                isSelected
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`relative w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 border border-brand-300'
                    : isCompleted
                      ? 'bg-success-50 border border-success-200'
                      : isSelected
                        ? 'bg-white border border-gray-900'
                        : 'bg-white border border-gray-200'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-3 h-3 text-brand-600 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />
                ) : (
                  <span className={isSelected ? 'text-gray-900' : 'text-gray-400'}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label + timing */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] font-medium truncate ${
                      isActive
                        ? 'text-brand-700'
                        : isSelected
                          ? 'text-gray-900'
                          : isCompleted
                            ? 'text-gray-700'
                            : 'text-gray-400'
                    }`}
                  >
                    {STAGE_LABELS[stage.id] || stage.label}
                  </span>
                  {elapsed && (
                    <span className="text-[10px] text-gray-400 font-mono ml-2 shrink-0">{elapsed}s</span>
                  )}
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 ml-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
