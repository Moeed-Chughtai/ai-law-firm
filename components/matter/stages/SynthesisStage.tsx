'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import { Brain, Loader2 } from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
};

export default function SynthesisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';
  const synthesized = issues.filter((i) => i.synthesis).length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Legal Judgment Synthesis
            </h3>
            <p className="text-xs text-gray-500">
              {isRunning
                ? `Synthesizing recommendations... (${synthesized}/${issues.length})`
                : 'Final recommendations formed for all issues'}
            </p>
          </div>
          {isRunning && (
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin ml-auto" />
          )}
        </div>

        {/* Progress */}
        <div className="mt-4 bg-surface-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500"
            style={{
              width: `${(synthesized / Math.max(issues.length, 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Per-issue synthesis */}
      <div className="space-y-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`glass-card-strong p-5 transition-all ${
              issue.synthesis ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[issue.severity]}`}
                  />
                  <h4 className="text-sm font-semibold text-gray-900">
                    {issue.title}
                  </h4>
                </div>
                <span className="text-xs text-gray-400">{issue.clauseRef}</span>
              </div>
              {issue.synthesis && (
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(issue.synthesis.confidence * 100)}%
                  </div>
                  <div className="text-[10px] text-gray-400">confidence</div>
                </div>
              )}
            </div>

            {issue.synthesis && (
              <>
                {/* Confidence bar */}
                <div className="mb-4 bg-surface-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      issue.synthesis.confidence >= 0.9
                        ? 'bg-emerald-500'
                        : issue.synthesis.confidence >= 0.8
                          ? 'bg-brand-500'
                          : issue.synthesis.confidence >= 0.7
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                    }`}
                    style={{
                      width: `${issue.synthesis.confidence * 100}%`,
                    }}
                  />
                </div>

                {/* Recommendation */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 mb-3">
                  <p className="text-sm font-medium text-purple-900 leading-relaxed">
                    {issue.synthesis.recommendation}
                  </p>
                </div>

                {/* Reasoning */}
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">
                    Why this matters
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {issue.synthesis.reasoning}
                  </p>
                </div>
              </>
            )}

            {!issue.synthesis && isRunning && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Synthesizing...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
