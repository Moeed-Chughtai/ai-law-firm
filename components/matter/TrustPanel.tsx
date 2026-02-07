'use client';

import { Matter } from '@/lib/types';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Eye,
  FileText,
  AlertCircle,
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
  const completedStages = matter.stages.filter(
    (s) => s.status === 'complete' || s.status === 'warning'
  ).length;

  // Determine guardrail status
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

  const guardrailBadge = {
    pending: { label: 'Pending', color: 'bg-surface-100 text-gray-500', icon: Shield },
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 },
    approved_warnings: {
      label: 'Approved w/ Warnings',
      color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      icon: AlertTriangle,
    },
    needs_review: {
      label: 'Needs Human Review',
      color: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      icon: Eye,
    },
  }[guardrailStatus];

  const GuardrailIcon = guardrailBadge.icon;

  return (
    <div className="p-5 space-y-6">
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Trust & Transparency
        </h2>
      </div>

      {/* Overall Confidence */}
      <div className="glass-card p-5 text-center">
        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-3">
          Overall Confidence
        </div>
        <div className="relative w-28 h-28 mx-auto mb-3">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#e8ecf4"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={confidencePercent >= 80 ? '#22c55e' : confidencePercent >= 60 ? '#eab308' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(confidencePercent / 100) * 327} 327`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">
              {confidencePercent || '—'}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {confidencePercent ? '%' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Risk Tolerance</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              matter.riskTolerance === 'low'
                ? 'bg-emerald-50 text-emerald-700'
                : matter.riskTolerance === 'medium'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {matter.riskTolerance === 'low'
              ? 'Conservative'
              : matter.riskTolerance === 'medium'
                ? 'Balanced'
                : 'Aggressive'}
          </span>
        </div>
      </div>

      {/* Guardrail Status */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-2">
          Guardrail Status
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${guardrailBadge.color}`}
        >
          <GuardrailIcon className="w-3.5 h-3.5" />
          {guardrailBadge.label}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="glass-card p-4 space-y-3">
        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
          Quick Stats
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Issues Found
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {matter.issues.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Critical / High
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {criticalCount} / {highCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Stages Complete
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {completedStages} / {matter.stages.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Doc Type
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Preview */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-50 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-700">Audit Log</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">
              {matter.auditLog.length} entries
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                showAuditLog ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        {showAuditLog && (
          <div className="border-t border-surface-200 max-h-60 overflow-y-auto">
            {matter.auditLog.length === 0 ? (
              <div className="p-4 text-xs text-gray-400 text-center">No entries yet</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {matter.auditLog.map((entry, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          entry.action === 'started'
                            ? 'bg-brand-50 text-brand-600'
                            : entry.action === 'completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{entry.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
