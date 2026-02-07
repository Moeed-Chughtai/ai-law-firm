'use client';

import { Matter, StageInfo, Issue, Severity } from '@/lib/types';
import {
  Loader2,
  Info,
  ArrowRight,
  Tag,
  Link2,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: 'severity-critical',
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
  info: 'severity-info',
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-error-500',
  high: 'bg-warning-500',
  medium: 'bg-yellow-500',
  low: 'bg-success-500',
  info: 'bg-brand-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  economics: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  control: 'bg-red-50 text-red-700 ring-red-200',
  governance: 'bg-violet-50 text-violet-700 ring-violet-200',
  information_rights: 'bg-blue-50 text-blue-700 ring-blue-200',
  protective_provisions: 'bg-orange-50 text-orange-700 ring-orange-200',
  transfer_restrictions: 'bg-pink-50 text-pink-700 ring-pink-200',
  dilution: 'bg-amber-50 text-amber-700 ring-amber-200',
  exit_rights: 'bg-teal-50 text-teal-700 ring-teal-200',
  representations: 'bg-slate-50 text-slate-700 ring-slate-200',
  conditions: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  definitions: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  other: 'bg-gray-50 text-gray-700 ring-gray-200',
};

export default function IssueAnalysisStage({ matter, stage }: Props) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';

  const severityCounts = (['critical', 'high', 'medium', 'low', 'info'] as Severity[])
    .map((sev) => ({ sev, count: issues.filter((i) => i.severity === sev).length }))
    .filter((s) => s.count > 0);

  const riskScore = issues.reduce((sum, i) => {
    const weights: Record<Severity, number> = { critical: 10, high: 7, medium: 4, low: 2, info: 0 };
    return sum + weights[i.severity];
  }, 0);

  // Group issues by category
  const categories = issues.reduce<Record<string, Issue[]>>((acc, issue) => {
    const cat = issue.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(issue);
    return acc;
  }, {});

  const interactionCount = issues.filter((i) => (i.interactionEffects?.length ?? 0) > 0).length;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Risk overview metrics */}
      <div>
        <h4 className="section-label mb-3">Risk overview</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="metric-card text-center">
            <div className="text-2xl font-semibold text-gray-900 tabular-nums">{issues.length}</div>
            <div className="text-[11px] text-gray-500">Issues found</div>
          </div>
          <div className="metric-card text-center">
            <div className={`text-2xl font-semibold tabular-nums ${riskScore > 30 ? 'text-error-600' : riskScore > 15 ? 'text-warning-600' : 'text-success-600'}`}>
              {riskScore}
            </div>
            <div className="text-[11px] text-gray-500">Risk score</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-2xl font-semibold text-gray-900 tabular-nums">
              {issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length}
            </div>
            <div className="text-[11px] text-gray-500">Action required</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-2xl font-semibold text-brand-600 tabular-nums">
              {interactionCount}
            </div>
            <div className="text-[11px] text-gray-500">Cross-clause</div>
          </div>
        </div>
      </div>

      {/* Severity distribution */}
      {severityCounts.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Severity breakdown</h4>
          <div className="card p-4">
            <div className="flex rounded-full h-1.5 overflow-hidden mb-3">
              {severityCounts.map(({ sev, count }) => (
                <div
                  key={sev}
                  className={`${SEVERITY_DOT[sev]} transition-all duration-700`}
                  style={{ width: `${(count / issues.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {severityCounts.map(({ sev, count }) => (
                <div key={sev} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
                  <span className="text-xs text-gray-600 capitalize">{sev}</span>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category distribution */}
      {Object.keys(categories).length > 1 && (
        <div>
          <h4 className="section-label mb-3">Issue categories</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(categories).map(([cat, catIssues]) => (
              <span
                key={cat}
                className={`text-[11px] font-medium px-2 py-1 rounded-md ring-1 ring-inset ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}`}
              >
                {cat.replace(/_/g, ' ')} ({catIssues.length})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Issues list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="section-label">Identified issues</h4>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-brand-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs font-medium">Analyzing…</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div
              key={issue.id}
              className="card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <button
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                className="w-full text-left p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`severity-badge ${SEVERITY_CLASSES[issue.severity]}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                      {issue.clauseRef}
                    </span>
                    {issue.category && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ring-inset ${CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.other}`}>
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" />
                        {issue.category.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {issue.confidence !== undefined && issue.confidence > 0 && (
                    <span className="text-xs font-mono text-gray-400 shrink-0">
                      {Math.round(issue.confidence * 100)}%
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-medium text-gray-900 mb-1.5">{issue.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{issue.explanation}</p>
              </button>

              {/* Expanded details */}
              {expandedIssue === issue.id && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  {/* Standard form deviation */}
                  {issue.standardFormDeviation && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-warning-50 border border-warning-100">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-warning-500 tracking-wider mb-0.5">Standard form deviation</div>
                        <p className="text-xs text-warning-800">{issue.standardFormDeviation}</p>
                      </div>
                    </div>
                  )}

                  {/* Statutory basis */}
                  {issue.statutoryBasis && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-brand-50 border border-brand-100">
                      <Scale className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-brand-500 tracking-wider mb-0.5">Statutory basis</div>
                        <p className="text-xs text-brand-800">{issue.statutoryBasis}</p>
                      </div>
                    </div>
                  )}

                  {/* Interaction effects */}
                  {(issue.interactionEffects?.length ?? 0) > 0 && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-gray-50 border border-gray-200">
                      <Link2 className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Cross-clause interactions</div>
                        <div className="space-y-1">
                          {issue.interactionEffects!.map((effect: string, ei: number) => (
                            <p key={ei} className="text-xs text-gray-700">{effect}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
          <span className="font-semibold text-gray-700">Next: Multi-Agent Research</span> — Four specialized agents research each issue in parallel: market norms, risk impact, negotiation leverage, and legal precedent.
        </p>
      </div>
    </div>
  );
}
