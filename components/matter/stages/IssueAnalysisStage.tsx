'use client';

import { Matter, StageInfo, Issue, Severity } from '@/lib/types';
import {
  Loader2,
  Info,
  ArrowRight,
} from 'lucide-react';

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

export default function IssueAnalysisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';

  const severityCounts = (['critical', 'high', 'medium', 'low', 'info'] as Severity[])
    .map((sev) => ({ sev, count: issues.filter((i) => i.severity === sev).length }))
    .filter((s) => s.count > 0);

  const riskScore = issues.reduce((sum, i) => {
    const weights: Record<Severity, number> = { critical: 10, high: 7, medium: 4, low: 2, info: 0 };
    return sum + weights[i.severity];
  }, 0);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Risk overview metrics */}
      <div>
        <h4 className="section-label mb-3">Risk overview</h4>
        <div className="grid grid-cols-3 gap-3">
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
              className="card p-4 animate-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
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
                </div>
                {issue.confidence !== undefined && issue.confidence > 0 && (
                  <span className="text-xs font-mono text-gray-400 shrink-0">
                    {Math.round(issue.confidence * 100)}%
                  </span>
                )}
              </div>

              <h4 className="text-sm font-medium text-gray-900 mb-1.5">{issue.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{issue.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Multi-Agent Research</span> — Specialized agents research each issue in parallel: market norms, risk impact, and negotiation leverage.
        </p>
      </div>
    </div>
  );
}
