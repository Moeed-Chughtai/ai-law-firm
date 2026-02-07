'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Eye,
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
      label: 'Jurisdiction Check',
      description: 'Verified Delaware corporate law compliance',
      status: guardrails.jurisdictionCheck,
      icon: Shield,
    },
    {
      label: 'Citation Completeness',
      description: 'All recommendations backed by legal sources',
      status: guardrails.citationCompleteness,
      icon: CheckCircle2,
    },
    {
      label: 'Confidence Threshold',
      description: `Score: ${Math.round(guardrails.confidenceThreshold.score * 100)}% / Required: ${Math.round(guardrails.confidenceThreshold.required * 100)}%`,
      status: guardrails.confidenceThreshold.pass ? 'pass' : 'fail',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Decision Card */}
      <div
        className={`glass-card-strong p-6 border-2 ${
          guardrails.escalationRequired
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-emerald-200 bg-emerald-50/30'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              guardrails.escalationRequired ? 'bg-amber-100' : 'bg-emerald-100'
            }`}
          >
            {guardrails.escalationRequired ? (
              <Eye className="w-6 h-6 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {guardrails.escalationRequired
                ? 'Human Review Recommended'
                : 'All Guardrails Passed'}
            </h3>
            <p className="text-sm text-gray-500">
              {guardrails.escalationRequired
                ? 'This matter requires additional human oversight'
                : 'This matter has passed all automated quality checks'}
            </p>
          </div>
        </div>

        {guardrails.escalationRequired && guardrails.escalationReason && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">{guardrails.escalationReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Individual checks */}
      <div className="space-y-3">
        {checks.map((check, i) => {
          const Icon = check.icon;
          const statusIcon =
            check.status === 'pass' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : check.status === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            );

          return (
            <div
              key={i}
              className="glass-card-strong p-5 flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  check.status === 'pass'
                    ? 'bg-emerald-50'
                    : check.status === 'warning'
                      ? 'bg-amber-50'
                      : 'bg-red-50'
                }`}
              >
                {statusIcon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {check.label}
                </h4>
                <p className="text-xs text-gray-500">{check.description}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  check.status === 'pass'
                    ? 'bg-emerald-50 text-emerald-700'
                    : check.status === 'warning'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                {check.status === 'pass'
                  ? 'Pass'
                  : check.status === 'warning'
                    ? 'Warning'
                    : 'Fail'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Confidence vs Threshold visualization */}
      <div className="glass-card-strong p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Confidence vs Threshold
        </h4>
        <div className="relative h-8 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
              guardrails.confidenceThreshold.pass
                ? 'bg-emerald-400'
                : 'bg-red-400'
            }`}
            style={{
              width: `${guardrails.confidenceThreshold.score * 100}%`,
            }}
          />
          {/* Threshold line */}
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-800"
            style={{
              left: `${guardrails.confidenceThreshold.required * 100}%`,
            }}
          />
          <div
            className="absolute -top-6 text-[10px] font-mono text-gray-500 transform -translate-x-1/2"
            style={{
              left: `${guardrails.confidenceThreshold.required * 100}%`,
            }}
          >
            Required: {Math.round(guardrails.confidenceThreshold.required * 100)}%
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span className="font-semibold text-gray-700">
            Score: {Math.round(guardrails.confidenceThreshold.score * 100)}%
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
