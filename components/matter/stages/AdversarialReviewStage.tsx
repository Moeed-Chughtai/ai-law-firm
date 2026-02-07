'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Swords,
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
  const data = stage.data;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Review Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Review Outcome</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">{critiques.length}</div>
            <div className="text-xs text-slate-500 mt-1">Points Examined</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className={`text-3xl font-serif font-bold ${draftRevised ? 'text-amber-600' : 'text-emerald-600'}`}>
              {draftRevised ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Revisions Made</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 mt-1">Quality Verified</div>
          </div>
        </div>
      </div>

      {/* Verdict Banner */}
      {draftRevised ? (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-amber-900">Draft Revised After Challenge</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              The adversarial reviewer identified weaknesses in the initial analysis. Recommendations have been strengthened and refined to address these critiques before finalization.
            </p>
          </div>
        </div>
      ) : critiques.length > 0 ? (
        <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-emerald-900">Original Analysis Upheld</h3>
            <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
              An independent AI review challenged the initial analysis and found it robust. No material weaknesses were identified — the recommendations stand as originally drafted.
            </p>
          </div>
        </div>
      ) : null}

      {/* How it works */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">How Adversarial Review Works</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          A separate AI model — with no knowledge of the original reasoning — independently reviews every recommendation, redline, and confidence score. It attempts to find flaws, missed edge cases, alternative interpretations, and unsupported conclusions. This mirrors the &quot;devil&apos;s advocate&quot; process used by top-tier law firms.
        </p>
      </div>

      {/* Critiques */}
      {critiques.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Review Points</h4>
          <div className="space-y-3">
            {critiques.map((critique, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-white">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">{critique}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Quality Guardrails</span> — Automated checks will verify jurisdiction compliance, citation completeness, and overall confidence thresholds before deliverables are generated.
        </p>
      </div>
    </div>
  );
}
