'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import {
  Eye,
  FileText,
  ArrowRight,
  Diff,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

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

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: 'border-l-error-400',
  high: 'border-l-warning-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-success-400',
  info: 'border-l-brand-300',
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
      {/* Redline metrics */}
      <div>
        <h4 className="section-label mb-3">Redline summary</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{issuesWithRedlines.length}</div>
            <div className="text-[11px] text-gray-500">Clauses reviewed</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-error-600 tabular-nums">{actionableRedlines.length}</div>
            <div className="text-[11px] text-gray-500">Changes proposed</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-success-600 tabular-nums">{unchangedClauses}</div>
            <div className="text-[11px] text-gray-500">Acceptable</div>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h4 className="section-label">Annotated redlines</h4>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('plain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              viewMode === 'plain'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-3 h-3" />
            Plain English
          </button>
          <button
            onClick={() => setViewMode('lawyer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              viewMode === 'lawyer'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-3 h-3" />
            Lawyer View
          </button>
        </div>
      </div>

      {/* Redlines */}
      <div className="space-y-3">
        {issuesWithRedlines.map((issue, idx) => {
          const isActionable = !issue.redline?.includes('No changes needed') && !issue.redline?.includes('No redline required');
          return (
            <div
              key={issue.id}
              className={`card overflow-hidden animate-slide-up ${isActionable ? `border-l-[3px] ${SEVERITY_BORDER[issue.severity]}` : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Header */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
                    <span className="text-sm font-medium text-gray-900">{issue.title}</span>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{issue.clauseRef}</span>
                  </div>
                  {isActionable ? (
                    <span className="severity-badge severity-high flex items-center gap-1">
                      <Diff className="w-2.5 h-2.5" /> Changed
                    </span>
                  ) : (
                    <span className="severity-badge severity-low flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Acceptable
                    </span>
                  )}
                </div>
              </div>

              {/* Redline content */}
              <div className="px-4 pb-4">
                <div className={`p-3 rounded-lg border ${isActionable ? 'bg-error-50/30 border-error-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div
                    className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none
                      [&_strong]:text-success-700 [&_strong]:bg-success-50 [&_strong]:px-1 [&_strong]:rounded
                      [&_del]:text-error-600 [&_del]:bg-error-50 [&_del]:px-1 [&_del]:rounded [&_del]:no-underline [&_del]:line-through
                      [&_em]:text-brand-700 [&_em]:not-italic [&_em]:font-medium"
                    dangerouslySetInnerHTML={{
                      __html: (issue.redline || '')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/~~(.*?)~~/g, '<del>$1</del>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/No changes needed/g, '<span class="text-success-500">No changes needed</span>')
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
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Redline legend</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-error-50 text-error-600 line-through rounded">Deleted text</span>
            <span className="text-[10px] text-gray-400">Remove from agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-success-50 text-success-700 font-semibold rounded">Added text</span>
            <span className="text-[10px] text-gray-400">Insert into agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs text-brand-700 font-medium rounded">Commentary</span>
            <span className="text-[10px] text-gray-400">Explanatory notes</span>
          </div>
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Adversarial Review</span> — An independent AI reviewer will challenge these recommendations and stress-test the reasoning before finalization.
        </p>
      </div>
    </div>
  );
}
