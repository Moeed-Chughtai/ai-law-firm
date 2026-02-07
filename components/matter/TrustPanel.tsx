'use client';

import { Matter } from '@/lib/types';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface TrustPanelProps {
  matter: Matter;
}

export default function TrustPanel({ matter }: TrustPanelProps) {
  const [showAuditLog, setShowAuditLog] = useState(false);

  const confidencePercent = Math.round((matter.overallConfidence || 0) * 100);
  const criticalCount = matter.issues.filter((i) => i.severity === 'critical').length;
  const highCount = matter.issues.filter((i) => i.severity === 'high').length;

  // Guardrail status
  let guardrailStatus: 'pending' | 'approved' | 'approved_warnings' | 'needs_review' = 'pending';
  if (matter.guardrails) {
    if (matter.guardrails.escalationRequired) {
      guardrailStatus = 'needs_review';
    } else if (
      matter.guardrails.citationCompleteness === 'warning' ||
      matter.guardrails.confidenceThreshold.score < 0.9
    ) {
      guardrailStatus = 'approved_warnings';
    } else {
      guardrailStatus = 'approved';
    }
  }

  const guardrailConfig = {
    pending: { label: 'Pending', cls: 'bg-gray-50 text-gray-500 ring-gray-200', Icon: Shield },
    approved: { label: 'Passed', cls: 'bg-success-50 text-success-700 ring-success-200', Icon: CheckCircle2 },
    approved_warnings: { label: 'Warnings', cls: 'bg-warning-50 text-warning-700 ring-warning-200', Icon: AlertTriangle },
    needs_review: { label: 'Review needed', cls: 'bg-error-50 text-error-700 ring-error-200', Icon: Eye },
  }[guardrailStatus];

  const { Icon: GuardrailIcon } = guardrailConfig;

  return (
    <div className="space-y-4">
      <span className="section-label">Trust & confidence</span>

      {/* Confidence score — simple metric, no donut */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 tabular-nums">
          {confidencePercent || '—'}%
        </span>
        <span className="text-xs text-gray-400">confidence</span>
      </div>

      {/* Progress bar representation */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            confidencePercent >= 80
              ? 'bg-success-500'
              : confidencePercent >= 60
                ? 'bg-warning-500'
                : 'bg-error-500'
          }`}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>

      {/* Risk counts — compact data rows */}
      <div className="space-y-0 divide-y divide-gray-100">
        <div className="data-row py-2">
          <span className="text-xs text-gray-500">Critical issues</span>
          <span className={`text-xs font-semibold tabular-nums ${criticalCount > 0 ? 'text-error-600' : 'text-gray-400'}`}>{criticalCount}</span>
        </div>
        <div className="data-row py-2">
          <span className="text-xs text-gray-500">High-risk issues</span>
          <span className={`text-xs font-semibold tabular-nums ${highCount > 0 ? 'text-warning-600' : 'text-gray-400'}`}>{highCount}</span>
        </div>
      </div>

      {/* Guardrails badge */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-500">Guardrails</span>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ring-1 ring-inset ${guardrailConfig.cls}`}>
          <GuardrailIcon className="w-3 h-3" />
          {guardrailConfig.label}
        </div>
      </div>

      {/* Audit log toggle */}
      <button
        onClick={() => setShowAuditLog(!showAuditLog)}
        className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span>Audit trail</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showAuditLog ? 'rotate-180' : ''}`} />
      </button>

      {showAuditLog && (
        <div className="border border-gray-100 rounded-lg p-2.5 max-h-28 overflow-y-auto space-y-1.5">
          {matter.stages
            .filter((s) => s.status !== 'pending')
            .reverse()
            .map((s) => (
              <div key={s.id} className="flex gap-2 text-[10px]">
                <span className="text-gray-400 font-mono shrink-0">
                  {new Date(s.completedAt || s.startedAt || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-gray-600 truncate">
                  {s.label} — {s.status}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
