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
    pending: { label: 'Pending', color: 'bg-slate-100 text-slate-500', icon: Shield },
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
    <div className="space-y-6">
      <div className="px-1">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Confidence & Trust
        </h2>
      </div>

      {/* Overall Confidence - Updated UI */}
      <div className="text-center py-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={confidencePercent >= 80 ? '#10b981' : confidencePercent >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(confidencePercent / 100) * 327} 327`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 font-serif">
              {confidencePercent || '—'}
            </span>
            <span className="text-[10px] uppercase text-slate-400 font-medium">%</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Confidence Score</p>
      </div>

      {/* Stats Grid - Updated UI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
             <div className="text-xl font-bold text-slate-900 mb-1 font-serif">{criticalCount}</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-wide">Critical Risks</div>
        </div>
         <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
             <div className="text-xl font-bold text-slate-900 mb-1 font-serif">{highCount}</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-wide">High Risks</div>
        </div>
      </div>

      {/* Guardrails Status - Updated UI */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-900">Safety Guardrails</span>
             <div className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 ${guardrailBadge.color}`}>
                <GuardrailIcon className="w-3 h-3" />
                {guardrailBadge.label}
             </div>
        </div>
        
        <div className="space-y-2 mt-2">
            {[
                { label: 'Jurisdiction Check', status: matter.guardrails?.jurisdictionCheck === 'pass' ? 'pass' : 'pending' },
                { label: 'Citation Verify', status: matter.guardrails?.citationCompleteness === 'pass' ? 'pass' : 'pending' }
            ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{item.label}</span>
                     <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'pass' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
            ))}
        </div>
      </div>

      {/* Audit Log Toggle - Updated UI */}
      <button
        onClick={() => setShowAuditLog(!showAuditLog)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <span>View Audit Trail</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showAuditLog ? 'rotate-180' : ''}`} />
      </button>

      {showAuditLog && (
        <div className="bg-white rounded-lg border border-slate-200 p-3 max-h-40 overflow-y-auto text-[10px] space-y-2">
           {matter.stages.filter(s => s.status !== 'pending').reverse().map((s) => (
               <div key={s.id} className="flex gap-2">
                   <span className="text-slate-400 font-mono shrink-0">
                       {new Date(s.completedAt || s.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                   </span>
                    <span className="text-slate-600">
                        {s.label} {s.status}
                    </span>
               </div>
           ))}
        </div>
      )}
    </div>
  );
}
