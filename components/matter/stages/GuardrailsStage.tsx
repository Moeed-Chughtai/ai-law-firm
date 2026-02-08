'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
  Gauge,
  Scale,
  BookOpen,
  Brain,
  Target,
  ShieldCheck,
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
      icon: Scale,
      label: 'Jurisdiction Compliance',
      description: 'Verified all recommendations comply with the governing jurisdiction\'s corporate law and regulatory framework.',
      status: guardrails.jurisdictionCheck,
      passDetail: 'All provisions validated against Delaware General Corporation Law (DGCL)',
      failDetail: 'Some recommendations may conflict with jurisdictional requirements',
    },
    {
      icon: BookOpen,
      label: 'Citation Completeness',
      description: 'Confirmed every recommendation is backed by identifiable legal authority, market precedent, or statutory reference.',
      status: guardrails.citationCompleteness,
      passDetail: 'All recommendations have supporting legal or market authority',
      failDetail: 'Some recommendations lack sufficient supporting authority',
    },
    {
      icon: Brain,
      label: 'Hallucination Check',
      description: 'Verified that no fabricated citations, invented statutes, or non-existent case law are referenced.',
      status: guardrails.hallucinationCheck || 'pass',
      passDetail: 'No hallucinated references or fabricated authorities detected',
      failDetail: 'Potential hallucinated citations detected — human verification required',
    },
    {
      icon: Target,
      label: 'Scope Compliance',
      description: 'Confirmed analysis stays within the defined engagement scope and does not exceed the scope of work.',
      status: guardrails.scopeComplianceCheck || 'pass',
      passDetail: 'All analysis within defined engagement scope boundaries',
      failDetail: 'Some analysis may exceed the defined engagement scope',
    },
    {
      icon: ShieldCheck,
      label: 'Ethics Check',
      description: 'Verified no unauthorized practice of law, no conflicts of interest in advice, and appropriate disclaimers present.',
      status: guardrails.ethicsCheck || 'pass',
      passDetail: 'Ethics and professional responsibility standards met',
      failDetail: 'Potential ethics concern flagged — review required',
    },
    {
      icon: Gauge,
      label: 'Confidence Threshold',
      description: `Aggregate confidence of ${Math.round(guardrails.confidenceThreshold.score * 100)}% vs. ${Math.round(guardrails.confidenceThreshold.required * 100)}% minimum required.`,
      status: guardrails.confidenceThreshold.pass ? 'pass' : 'fail',
      passDetail: 'Confidence exceeds minimum threshold for automated delivery',
      failDetail: 'Confidence below threshold — human review recommended',
    },
  ];

  const passedCount = checks.filter((c) => c.status === 'pass').length;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Decision banner */}
      <div
        className={`p-4 rounded-lg border ${
          guardrails.escalationRequired
            ? 'border-warning-200 bg-warning-50'
            : 'border-success-200 bg-success-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {guardrails.escalationRequired ? (
            <Eye className="w-5 h-5 text-warning-600 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-success-600 mt-0.5 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {guardrails.escalationRequired
                ? 'Human Review Recommended'
                : 'All Quality Guardrails Passed'}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {guardrails.escalationRequired
                ? 'One or more quality checks flagged this matter for human oversight before action is taken.'
                : `Passed all ${checks.length} automated quality checks. The analysis meets confidence, compliance, and ethics thresholds.`}
            </p>
            <span
              className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                guardrails.escalationRequired
                  ? 'bg-warning-100 text-warning-800'
                  : 'bg-success-100 text-success-800'
              }`}
            >
              {passedCount}/{checks.length} checks passed
            </span>
          </div>
        </div>

        {guardrails.escalationRequired && guardrails.escalationReason && (
          <div className="mt-3 p-3 rounded-md bg-warning-100 border border-warning-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-warning-700 mt-0.5 shrink-0" />
              <p className="text-xs text-warning-800 leading-relaxed">{guardrails.escalationReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Individual checks */}
      <div>
        <h4 className="section-label mb-3">Quality checks</h4>
        <div className="space-y-2">
          {checks.map((check, i) => {
            const isPassing = check.status === 'pass';
            const isWarning = check.status === 'warning';
            const CheckIcon = check.icon;

            return (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isPassing ? (
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-warning-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-error-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="w-3.5 h-3.5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">{check.label}</h4>
                      </div>
                      <span
                        className={`severity-badge shrink-0 ${
                          isPassing
                            ? 'severity-low'
                            : isWarning
                            ? 'severity-medium'
                            : 'severity-critical'
                        }`}
                      >
                        {isPassing ? 'Pass' : isWarning ? 'Warning' : 'Fail'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{check.description}</p>
                    <p
                      className={`text-[11px] mt-1.5 font-medium ${
                        isPassing ? 'text-success-600' : isWarning ? 'text-warning-600' : 'text-error-600'
                      }`}
                    >
                      {isPassing ? check.passDetail : check.failDetail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <h4 className="section-label mb-3">Confidence score</h4>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analysis confidence</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                guardrails.confidenceThreshold.pass ? 'text-success-600' : 'text-error-600'
              }`}
            >
              {Math.round(guardrails.confidenceThreshold.score * 100)}%
            </span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                guardrails.confidenceThreshold.pass ? 'bg-success-500' : 'bg-error-500'
              }`}
              style={{ width: `${guardrails.confidenceThreshold.score * 100}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-800 z-10"
              style={{ left: `${guardrails.confidenceThreshold.required * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-gray-400 font-mono">0%</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-gray-800 rounded" />
              <span className="text-[10px] text-gray-500 font-medium">
                Required: {Math.round(guardrails.confidenceThreshold.required * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">100%</span>
          </div>
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Deliverables</span> — Final legal work product packaged: engagement letter, comprehensive memo, annotated redline, risk summary, and audit log.
        </p>
      </div>
    </div>
  );
}
