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
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

const STAGE_ICONS: Record<StageId, React.ElementType> = {
  intake: ClipboardCheck,
  parsing: FileSearch,
  issue_analysis: AlertCircle,
  research: Search,
  synthesis: Brain,
  drafting: PenTool,
  adversarial_review: ShieldCheck,
  guardrails: Lock,
  deliverables: Package,
};

const STAGE_DESCRIPTIONS: Record<StageId, string> = {
  intake: 'Scope & accept matter',
  parsing: 'Extract document structure',
  issue_analysis: 'Detect legal issues',
  research: 'Agent swarm analysis',
  synthesis: 'Form recommendations',
  drafting: 'Generate redlines',
  adversarial_review: 'Internal challenge',
  guardrails: 'Safety & approval',
  deliverables: 'Package outputs',
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
  return (
    <div className="p-5">
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Legal Workflow
        </h2>
      </div>

      <div className="space-y-1">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.id];
          const isSelected = selectedStage === stage.id;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[19px] top-[44px] w-[2px] h-[calc(100%-8px)] ${
                    stage.status === 'complete' || stage.status === 'warning'
                      ? 'bg-emerald-200'
                      : stage.status === 'running'
                        ? 'bg-gradient-to-b from-brand-300 to-surface-200'
                        : 'bg-surface-200'
                  }`}
                />
              )}

              <button
                onClick={() => onSelectStage(stage.id)}
                className={`relative w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
                  isSelected
                    ? 'bg-brand-50/80 ring-1 ring-brand-200'
                    : 'hover:bg-surface-100'
                }`}
              >
                {/* Status indicator */}
                <div
                  className={`relative w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    stage.status === 'running'
                      ? 'bg-brand-100'
                      : stage.status === 'complete'
                        ? 'bg-emerald-100'
                        : stage.status === 'warning'
                          ? 'bg-amber-100'
                          : stage.status === 'blocked'
                            ? 'bg-red-100'
                            : 'bg-surface-100'
                  }`}
                >
                  {stage.status === 'running' ? (
                    <Loader2 className="w-3 h-3 text-brand-600 animate-spin" />
                  ) : stage.status === 'complete' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : stage.status === 'warning' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  ) : stage.status === 'blocked' ? (
                    <XCircle className="w-3 h-3 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-surface-300" />
                  )}

                  {stage.status === 'running' && (
                    <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-ping opacity-30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        stage.status === 'running'
                          ? 'text-brand-600'
                          : stage.status === 'complete'
                            ? 'text-emerald-600'
                            : stage.status === 'warning'
                              ? 'text-amber-600'
                              : isSelected
                                ? 'text-brand-500'
                                : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
                        stage.status === 'running'
                          ? 'text-brand-700'
                          : stage.status === 'complete' || stage.status === 'warning'
                            ? 'text-gray-900'
                            : isSelected
                              ? 'text-brand-700'
                              : 'text-gray-500'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      stage.status === 'running'
                        ? 'text-brand-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {STAGE_DESCRIPTIONS[stage.id]}
                  </p>
                  {stage.completedAt && (
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(stage.completedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
