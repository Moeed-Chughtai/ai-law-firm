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
  Circle,
  ArrowRight,
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

const STAGE_LABELS: Record<StageId, string> = {
  intake: 'Intake & Scoping',
  parsing: 'Document Extraction',
  issue_analysis: 'Issue Spotting',
  research: 'Legal Research',
  synthesis: 'Analysis Synthesis',
  drafting: 'Redlining & Drafting',
  adversarial_review: 'Adversarial Review',
  guardrails: 'Safety Guardrails',
  deliverables: 'Final Deliverables',
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
    <div className="p-4 py-6">
      <div className="flex items-center gap-2 mb-6 px-3">
         <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
         <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Analysis Pipeline
        </h2>
      </div>

      <div className="relative space-y-0">
        {/* Continuous Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-200 z-0" />

        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.id];
          const isSelected = selectedStage === stage.id;
          const isActive = stage.status === 'running';
          const isCompleted = stage.status === 'complete' || stage.status === 'warning';
          
          return (
            <div key={stage.id} className="relative z-10">
              <button
                onClick={() => onSelectStage(stage.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all group ${
                  isSelected
                    ? 'bg-slate-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Status Dot */}
                <div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                    isActive
                      ? 'bg-white border-accent-500 shadow-md shadow-accent-500/20'
                      : isCompleted
                        ? 'bg-emerald-500 border-emerald-500'
                        : isSelected
                            ? 'bg-white border-slate-900'
                            : 'bg-white border-slate-200'
                  }`}
                >
                  {isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent-600 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                        {index + 1}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium truncate transition-colors ${
                        isActive
                            ? 'text-accent-700'
                            : isSelected
                                ? 'text-slate-900'
                                : isCompleted ? 'text-slate-700' : 'text-slate-500'
                      }`}
                    >
                      {STAGE_LABELS[stage.id] || stage.label}
                    </span>
                    {isActive && (
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                        </span>
                    )}
                  </div>
                  
                  {stage.completedAt && (
                     <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {((new Date(stage.completedAt).getTime() - new Date(stage.startedAt || 0).getTime()) / 1000).toFixed(1)}s
                     </div>
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

