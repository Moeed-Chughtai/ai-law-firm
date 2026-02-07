'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import {
  Loader2,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Target,
  ShieldAlert,
  XOctagon,
  Hash,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-error-500',
  high: 'bg-warning-500',
  medium: 'bg-yellow-500',
  low: 'bg-success-500',
  info: 'bg-brand-400',
};

const CONFIDENCE_BAR = (c: number) =>
  c >= 0.9 ? 'bg-success-500' : c >= 0.8 ? 'bg-brand-500' : c >= 0.7 ? 'bg-warning-500' : 'bg-error-500';

const PRIORITY_COLOR = (rank: number) =>
  rank <= 1 ? 'bg-error-100 text-error-800 ring-error-200' : rank <= 2 ? 'bg-warning-100 text-warning-800 ring-warning-200' : rank <= 3 ? 'bg-yellow-100 text-yellow-800 ring-yellow-200' : 'bg-gray-100 text-gray-700 ring-gray-200';

export default function SynthesisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';
  const synthesized = issues.filter((i) => i.synthesis).length;

  const avgConfidence =
    synthesized > 0
      ? issues.filter((i) => i.synthesis).reduce((s, i) => s + i.synthesis!.confidence, 0) / synthesized
      : 0;

  // Sort by priority rank (if available)
  const sortedIssues = [...issues].sort((a, b) => {
    const aRank = a.synthesis?.priorityRank ?? 99;
    const bRank = b.synthesis?.priorityRank ?? 99;
    return aRank - bRank;
  });

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Synthesis metrics */}
      <div>
        <h4 className="section-label mb-3">Synthesis progress</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {synthesized}/{issues.length}
            </div>
            <div className="text-[11px] text-gray-500">Synthesized</div>
          </div>
          <div className="metric-card text-center">
            <div className={`text-xl font-semibold tabular-nums ${avgConfidence >= 0.85 ? 'text-success-600' : avgConfidence >= 0.7 ? 'text-warning-600' : 'text-error-600'}`}>
              {avgConfidence > 0 ? `${Math.round(avgConfidence * 100)}%` : '—'}
            </div>
            <div className="text-[11px] text-gray-500">Avg. confidence</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {issues.filter((i) => i.synthesis && i.severity !== 'info').length}
            </div>
            <div className="text-[11px] text-gray-500">Actionable</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-error-600 tabular-nums">
              {issues.filter((i) => i.synthesis?.walkAwayThreshold).length}
            </div>
            <div className="text-[11px] text-gray-500">Walk-away flags</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${(synthesized / Math.max(issues.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Per-issue recommendations */}
      <div>
        <h4 className="section-label mb-3">Recommendations <span className="text-gray-400 font-normal">(priority ordered)</span></h4>
        <div className="space-y-3">
          {sortedIssues.map((issue, idx) => (
            <div
              key={issue.id}
              className={`card p-4 animate-slide-up ${issue.synthesis ? 'opacity-100' : 'opacity-40'}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Issue header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
                  <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                  <span className="text-[10px] font-mono text-gray-400">{issue.clauseRef}</span>
                </div>
                <div className="flex items-center gap-2">
                  {issue.synthesis?.priorityRank && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset ${PRIORITY_COLOR(issue.synthesis.priorityRank)}`}>
                      P{issue.synthesis.priorityRank}
                    </span>
                  )}
                  {issue.synthesis && (
                    <span className="text-xs font-mono text-gray-500 shrink-0">
                      {Math.round(issue.synthesis.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {issue.synthesis && (
                <>
                  {/* Confidence bar */}
                  <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${CONFIDENCE_BAR(issue.synthesis.confidence)}`}
                      style={{ width: `${issue.synthesis.confidence * 100}%` }}
                    />
                  </div>

                  {/* Primary Action / Fallback / Walk-away */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    {issue.synthesis.primaryAction && (
                      <div className="p-2.5 rounded-lg bg-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="w-3 h-3 text-success-400" />
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Primary action</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed">{issue.synthesis.primaryAction}</p>
                      </div>
                    )}
                    {issue.synthesis.fallbackPosition && (
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3 text-warning-500" />
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Fallback</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{issue.synthesis.fallbackPosition}</p>
                      </div>
                    )}
                    {issue.synthesis.walkAwayThreshold && (
                      <div className="p-2.5 rounded-lg bg-error-50 border border-error-100">
                        <div className="flex items-center gap-1 mb-1">
                          <XOctagon className="w-3 h-3 text-error-500" />
                          <span className="text-[10px] uppercase font-semibold text-error-400 tracking-wider">Walk-away</span>
                        </div>
                        <p className="text-xs text-error-700 leading-relaxed">{issue.synthesis.walkAwayThreshold}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="p-3 rounded-lg bg-gray-900 mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Recommendation</span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      {issue.synthesis.recommendation}
                    </p>
                  </div>

                  {/* Reasoning */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Reasoning</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {issue.synthesis.reasoning}
                    </p>
                  </div>
                </>
              )}

              {!issue.synthesis && isRunning && (
                <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Synthesizing…</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Redline Drafting</span> — Recommendations translated into concrete redline markup with exact contract language changes.
        </p>
      </div>
    </div>
  );
}
