'use client';

import { Matter, StageInfo, Issue, Severity } from '@/lib/types';
import { AlertCircle, Loader2 } from 'lucide-react';

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
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
};

export default function IssueAnalysisStage({ matter, stage }: Props) {
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Issue Detection</h3>
            <p className="text-xs text-gray-500">
              {isRunning
                ? 'Scanning document for legal issues...'
                : `Found ${issues.length} issues in the document`}
            </p>
          </div>
          {isRunning && (
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin ml-auto" />
          )}
        </div>

        {/* Severity distribution */}
        {issues.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-200">
            {(['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map((sev) => {
              const count = issues.filter((i) => i.severity === sev).length;
              if (count === 0) return null;
              return (
                <div key={sev} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
                  <span className="text-xs text-gray-500 capitalize">{sev}</span>
                  <span className="text-xs font-bold text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issues Table */}
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div
            key={issue.id}
            className="glass-card-strong p-5 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`severity-badge ${SEVERITY_CLASSES[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <span className="text-xs text-gray-400">{issue.clauseRef}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                  {issue.title}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {issue.explanation}
                </p>
              </div>
              {issue.confidence !== undefined && issue.confidence > 0 && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(issue.confidence * 100)}%
                  </div>
                  <div className="text-[10px] text-gray-400">confidence</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center justify-center py-6 gap-2 text-brand-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Detecting more issues...</span>
          </div>
        )}
      </div>
    </div>
  );
}
