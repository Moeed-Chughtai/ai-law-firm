'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import {
  PenTool,
  Eye,
  FileText,
  ArrowRight,
  Diff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
  info: 'bg-sky-500',
};

const SEVERITY_RING: Record<Severity, string> = {
  critical: 'border-red-300',
  high: 'border-orange-300',
  medium: 'border-amber-300',
  low: 'border-emerald-300',
  info: 'border-sky-300',
};

export default function DraftingStage({ matter, stage }: Props) {
  const [viewMode, setViewMode] = useState<'plain' | 'lawyer'>(
    matter.audience === 'founder' ? 'plain' : 'lawyer'
  );
  const issues = matter.issues || [];
  const issuesWithRedlines = issues.filter((i) => i.redline);
  const actionableRedlines = issuesWithRedlines.filter(
    (i) => !i.redline?.includes('No changes needed') && !i.redline?.includes('No redline required')
  );
  const unchangedClauses = issuesWithRedlines.length - actionableRedlines.length;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Drafting Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Redline Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">{issuesWithRedlines.length}</div>
            <div className="text-xs text-slate-500 mt-1">Clauses Reviewed</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-red-600">{actionableRedlines.length}</div>
            <div className="text-xs text-slate-500 mt-1">Changes Proposed</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-emerald-600">{unchangedClauses}</div>
            <div className="text-xs text-slate-500 mt-1">Clauses Acceptable</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Annotated Redlines</h4>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('plain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'plain'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Plain English
          </button>
          <button
            onClick={() => setViewMode('lawyer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'lawyer'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Lawyer View
          </button>
        </div>
      </div>

      {/* Redlines */}
      <div className="space-y-4">
        {issuesWithRedlines.map((issue, idx) => {
          const isActionable = !issue.redline?.includes('No changes needed') && !issue.redline?.includes('No redline required');
          return (
            <div
              key={issue.id}
              className={`bg-white border rounded-xl shadow-sm overflow-hidden animate-slide-up ${isActionable ? `border-l-4 ${SEVERITY_RING[issue.severity]}` : 'border-slate-200'}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
                    <span className="text-sm font-semibold text-slate-900">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{issue.clauseRef}</span>
                    {isActionable ? (
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Diff className="w-2.5 h-2.5" /> Changed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Acceptable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Redline content */}
              <div className="px-5 pb-5">
                <div className={`p-4 rounded-xl border ${isActionable ? 'bg-red-50/30 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div
                    className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none
                      [&_strong]:text-emerald-700 [&_strong]:bg-emerald-50 [&_strong]:px-1 [&_strong]:rounded
                      [&_del]:text-red-600 [&_del]:bg-red-50 [&_del]:px-1 [&_del]:rounded [&_del]:no-underline [&_del]:line-through
                      [&_em]:text-sky-700 [&_em]:not-italic [&_em]:font-medium"
                    dangerouslySetInnerHTML={{
                      __html: (issue.redline || '')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/~~(.*?)~~/g, '<del>$1</del>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/✅/g, '<span class="text-emerald-500">✅</span>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Redline Legend</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-red-50 text-red-600 line-through rounded">Deleted text</span>
            <span className="text-[10px] text-slate-400">Remove from agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 font-semibold rounded">Added text</span>
            <span className="text-[10px] text-slate-400">Insert into agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs text-sky-700 font-medium rounded">Commentary</span>
            <span className="text-[10px] text-slate-400">Explanatory notes</span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Adversarial Review</span> — An independent AI reviewer will challenge these recommendations, stress-test the reasoning, and identify any weaknesses before finalization.
        </p>
      </div>
    </div>
  );
}
