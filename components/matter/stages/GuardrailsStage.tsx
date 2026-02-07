'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Eye,
  ArrowRight,
  Gauge,
  Scale,
  BookOpen,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function GuardrailsStage({ matter, stage }: Props) {
  const guardrails = matter.guardrails;

  if (!guardrails) return null;

  const checks = [
    {
      label: 'Jurisdiction Compliance',
      description: 'Verified all recommendations comply with the governing jurisdiction\'s corporate law and regulatory framework.',
      status: guardrails.jurisdictionCheck,
      icon: Scale,
      passDetail: 'All provisions validated against Delaware General Corporation Law (DGCL)',
      failDetail: 'Some recommendations may conflict with jurisdictional requirements',
    },
    {
      label: 'Citation Completeness',
      description: 'Confirmed every recommendation is backed by identifiable legal authority, market precedent, or statutory reference.',
      status: guardrails.citationCompleteness,
      icon: BookOpen,
      passDetail: 'All recommendations have supporting legal or market authority',
      failDetail: 'Some recommendations lack sufficient supporting authority',
    },
    {
      label: 'Confidence Threshold',
      description: `Aggregate analysis confidence of ${Math.round(guardrails.confidenceThreshold.score * 100)}% vs. the ${Math.round(guardrails.confidenceThreshold.required * 100)}% minimum required for automated output.`,
      status: guardrails.confidenceThreshold.pass ? 'pass' : 'fail',
      icon: Gauge,
      passDetail: 'Confidence exceeds minimum threshold for automated delivery',
      failDetail: 'Confidence below threshold — human review recommended',
    },
  ];

  const passedCount = checks.filter(c => c.status === 'pass').length;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Decision Card */}
      <div
        className={`p-6 rounded-xl border-2 ${
          guardrails.escalationRequired
            ? 'border-amber-300 bg-amber-50'
            : 'border-emerald-300 bg-emerald-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
              guardrails.escalationRequired ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          >
            {guardrails.escalationRequired ? (
              <Eye className="w-7 h-7 text-white" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-slate-900">
              {guardrails.escalationRequired
                ? 'Human Review Recommended'
                : 'All Quality Guardrails Passed'}
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {guardrails.escalationRequired
                ? 'One or more automated quality checks flagged this matter for additional human oversight before action is taken on the deliverables.'
                : `This matter passed all ${checks.length} automated quality checks. The analysis meets the confidence and compliance thresholds for automated delivery.`}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${guardrails.escalationRequired ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                {passedCount}/{checks.length} checks passed
              </span>
            </div>
          </div>
        </div>

        {guardrails.escalationRequired && guardrails.escalationReason && (
          <div className="mt-4 p-4 rounded-xl bg-amber-100 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 leading-relaxed">{guardrails.escalationReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Individual Checks */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quality Checks</h4>
        <div className="space-y-3">
          {checks.map((check, i) => {
            const Icon = check.icon;
            const isPassing = check.status === 'pass';
            const isWarning = check.status === 'warning';

            return (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPassing ? 'bg-emerald-100' : isWarning ? 'bg-amber-100' : 'bg-red-100'
                    }`}
                  >
                    {isPassing ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">{check.label}</h4>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isPassing ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isPassing ? '✓ Pass' : isWarning ? '⚠ Warning' : '✗ Fail'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{check.description}</p>
                    <p className={`text-[11px] mt-2 font-medium ${isPassing ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`}>
                      {isPassing ? check.passDetail : check.failDetail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidence Visualization */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Confidence Score</h4>
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Analysis Confidence</span>
            <span className={`text-sm font-bold ${guardrails.confidenceThreshold.pass ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.round(guardrails.confidenceThreshold.score * 100)}%
            </span>
          </div>
          <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                guardrails.confidenceThreshold.pass ? 'bg-emerald-400' : 'bg-red-400'
              }`}
              style={{ width: `${guardrails.confidenceThreshold.score * 100}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-800 z-10"
              style={{ left: `${guardrails.confidenceThreshold.required * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-400">0%</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-slate-800 rounded" />
              <span className="text-[10px] text-slate-500 font-medium">
                Required: {Math.round(guardrails.confidenceThreshold.required * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">100%</span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Deliverables</span> — Your final legal work product will be packaged into downloadable documents: a comprehensive memo, redline markup, and structured JSON data.
        </p>
      </div>
    </div>
  );
}
