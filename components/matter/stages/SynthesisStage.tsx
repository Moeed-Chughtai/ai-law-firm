'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import {
  Brain,
  Loader2,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
  info: 'bg-sky-500',
};

const CONFIDENCE_LABEL = (c: number) =>
  c >= 0.95 ? 'Very High' : c >= 0.85 ? 'High' : c >= 0.75 ? 'Moderate' : c >= 0.6 ? 'Fair' : 'Low';

const CONFIDENCE_COLOR = (c: number) =>
  c >= 0.9 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : c >= 0.8 ? 'text-sky-600 bg-sky-50 border-sky-200'
    : c >= 0.7 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';

const CONFIDENCE_BAR = (c: number) =>
  c >= 0.9 ? 'bg-emerald-500' : c >= 0.8 ? 'bg-sky-500' : c >= 0.7 ? 'bg-amber-500' : 'bg-red-500';

export default function SynthesisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';
  const synthesized = issues.filter((i) => i.synthesis).length;

  const avgConfidence = synthesized > 0
    ? issues.filter(i => i.synthesis).reduce((s, i) => s + i.synthesis!.confidence, 0) / synthesized
    : 0;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Synthesis Progress */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Synthesis Progress</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">
              {synthesized}/{issues.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Issues Synthesized</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className={`text-3xl font-serif font-bold ${avgConfidence >= 0.85 ? 'text-emerald-600' : avgConfidence >= 0.7 ? 'text-amber-600' : 'text-red-600'}`}>
              {avgConfidence > 0 ? `${Math.round(avgConfidence * 100)}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Avg. Confidence</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">
              {issues.filter(i => i.synthesis && i.severity !== 'info').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Actionable Items</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-slate-800 rounded-full transition-all duration-500"
            style={{ width: `${(synthesized / Math.max(issues.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Per-issue synthesis */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recommendations</h4>
        <div className="space-y-4">
          {issues.map((issue, idx) => (
            <div
              key={issue.id}
              className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 transition-all animate-slide-up ${
                issue.synthesis ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Issue header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[issue.severity]}`} />
                    <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{issue.clauseRef}</span>
                </div>
                {issue.synthesis && (
                  <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${CONFIDENCE_COLOR(issue.synthesis.confidence)}`}>
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(issue.synthesis.confidence * 100)}% — {CONFIDENCE_LABEL(issue.synthesis.confidence)}
                  </div>
                )}
              </div>

              {issue.synthesis && (
                <>
                  {/* Confidence bar */}
                  <div className="mb-4 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${CONFIDENCE_BAR(issue.synthesis.confidence)}`}
                      style={{ width: `${issue.synthesis.confidence * 100}%` }}
                    />
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-xl bg-slate-900 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Recommendation</span>
                    </div>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {issue.synthesis.recommendation}
                    </p>
                  </div>

                  {/* Reasoning */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Legal Reasoning</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {issue.synthesis.reasoning}
                    </p>
                  </div>
                </>
              )}

              {!issue.synthesis && isRunning && (
                <div className="flex items-center gap-2 text-slate-400 mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Synthesizing recommendation...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Redline Drafting</span> — Recommendations will be translated into concrete redline markup with exact contract language changes you can present to counterparty counsel.
        </p>
      </div>
    </div>
  );
}
