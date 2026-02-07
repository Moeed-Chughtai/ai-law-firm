'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function AdversarialReviewStage({ matter, stage }: Props) {
  const critiques = matter.adversarialCritiques || [];
  const draftRevised = matter.draftRevised;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Review metrics */}
      <div>
        <h4 className="section-label mb-3">Review outcome</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{critiques.length}</div>
            <div className="text-[11px] text-gray-500">Points examined</div>
          </div>
          <div className="metric-card text-center">
            <div className={`text-xl font-semibold tabular-nums ${draftRevised ? 'text-warning-600' : 'text-success-600'}`}>
              {draftRevised ? 'Yes' : 'No'}
            </div>
            <div className="text-[11px] text-gray-500">Revisions made</div>
          </div>
          <div className="metric-card text-center">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success-500" />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Quality verified</div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      {draftRevised ? (
        <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <RefreshCw className="w-4 h-4 text-warning-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-warning-900">Draft revised after challenge</h3>
            <p className="text-xs text-warning-700 mt-1 leading-relaxed">
              The adversarial reviewer identified weaknesses. Recommendations have been strengthened and refined to address these critiques before finalization.
            </p>
          </div>
        </div>
      ) : critiques.length > 0 ? (
        <div className="flex items-start gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
          <Shield className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-success-900">Original analysis upheld</h3>
            <p className="text-xs text-success-700 mt-1 leading-relaxed">
              An independent review challenged the initial analysis and found it robust. No material weaknesses identified — recommendations stand as originally drafted.
            </p>
          </div>
        </div>
      ) : null}

      {/* How it works */}
      <div className="card p-4">
        <h4 className="section-label mb-2">How adversarial review works</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          A separate AI model — with no knowledge of the original reasoning — independently reviews every recommendation, redline, and confidence score. It attempts to find flaws, missed edge cases, alternative interpretations, and unsupported conclusions. This mirrors the &quot;devil&apos;s advocate&quot; process used by top-tier law firms.
        </p>
      </div>

      {/* Critiques */}
      {critiques.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Review points</h4>
          <div className="space-y-2">
            {critiques.map((critique, i) => (
              <div
                key={i}
                className="card p-4 flex items-start gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-[11px] font-mono font-semibold text-gray-400 bg-gray-100 w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{critique}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Quality Guardrails</span> — Automated checks will verify jurisdiction compliance, citation completeness, and confidence thresholds before deliverables are generated.
        </p>
      </div>
    </div>
  );
}
