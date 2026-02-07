'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
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
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Internal Adversarial Review
            </h3>
            <p className="text-xs text-gray-500">
              Independent AI review challenging the initial analysis
            </p>
          </div>
        </div>

        {/* Revision indicator */}
        {draftRevised && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              Draft revised after internal challenge — recommendations were strengthened
            </span>
          </div>
        )}

        {!draftRevised && critiques.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              Original analysis passed internal review — no revisions required
            </span>
          </div>
        )}

        <div className="text-xs text-gray-400">
          {critiques.length} review points examined
        </div>
      </div>

      {/* Critiques */}
      <div className="space-y-3">
        {critiques.map((critique, i) => (
          <div
            key={i}
            className="glass-card p-4 flex items-start gap-3 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">{critique}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
