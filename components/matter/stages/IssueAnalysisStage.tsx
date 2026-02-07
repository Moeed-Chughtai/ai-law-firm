'use client';

import { Matter, StageInfo, Issue, Severity } from '@/lib/types';
import {
  AlertCircle,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingUp,
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
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
  info: 'bg-sky-500',
};

const SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-50 border-red-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-amber-50 border-amber-200',
  low: 'bg-emerald-50 border-emerald-200',
  info: 'bg-sky-50 border-sky-200',
};

const SEVERITY_DESC: Record<Severity, string> = {
  critical: 'Requires immediate attention — could void or materially impair the agreement',
  high: 'Significant risk — deviates meaningfully from market standard protections',
  medium: 'Moderate concern — non-standard provision that warrants negotiation',
  low: 'Minor observation — slightly atypical but generally acceptable',
  info: 'Informational — context about standard provisions for your awareness',
};

export default function IssueAnalysisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';

  const severityCounts = (['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map(sev => ({
    sev,
    count: issues.filter(i => i.severity === sev).length,
  })).filter(s => s.count > 0);

  const riskScore = issues.reduce((sum, i) => {
    const weights: Record<Severity, number> = { critical: 10, high: 7, medium: 4, low: 2, info: 0 };
    return sum + weights[i.severity];
  }, 0);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Risk Overview */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Risk Overview</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">{issues.length}</div>
            <div className="text-xs text-slate-500 mt-1">Issues Found</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className={`text-3xl font-serif font-bold ${riskScore > 30 ? 'text-red-600' : riskScore > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {riskScore}
            </div>
            <div className="text-xs text-slate-500 mt-1">Risk Score</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">
              {issues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Action Required</div>
          </div>
        </div>
      </div>

      {/* Severity Distribution */}
      {severityCounts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Severity Breakdown</h4>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            {/* Visual bar */}
            <div className="flex rounded-full h-3 overflow-hidden mb-4">
              {severityCounts.map(({ sev, count }) => (
                <div
                  key={sev}
                  className={`${SEVERITY_DOT[sev]} transition-all duration-700`}
                  style={{ width: `${(count / issues.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {severityCounts.map(({ sev, count }) => (
                <div key={sev} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_DOT[sev]}`} />
                  <span className="text-xs text-slate-600 capitalize font-medium">{sev}</span>
                  <span className="text-xs font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Identified Issues</h4>
          {isRunning && (
            <div className="flex items-center gap-2 text-sky-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs font-medium">Analyzing...</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div
              key={issue.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`severity-badge ${SEVERITY_CLASSES[issue.severity]}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {issue.clauseRef}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                </div>
                {issue.confidence !== undefined && issue.confidence > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-serif font-bold text-slate-900">
                      {Math.round(issue.confidence * 100)}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">confidence</div>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{issue.explanation}</p>

              {/* Severity context */}
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${SEVERITY_BG[issue.severity]}`}>
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-semibold capitalize">{issue.severity} severity</span> — {SEVERITY_DESC[issue.severity]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Multi-Agent Research</span> — Three specialized AI agents will research each issue in parallel: analyzing market norms, quantifying risk impact, and identifying negotiation leverage.
        </p>
      </div>
    </div>
  );
}
