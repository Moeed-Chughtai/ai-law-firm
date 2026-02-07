'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  CheckCircle2,
  MapPin,
  Lock,
  FileText,
  Shield,
  Target,
  Users,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function IntakeStage({ matter, stage }: Props) {
  const data = stage.data;

  if (!data) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Matter Accepted Card */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Matter Accepted</h3>
            <p className="text-xs text-gray-500">
              This document has been accepted for review
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Document Type
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{data.detectedDocType}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Jurisdiction
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{data.jurisdictionConfirmed}</p>
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Risk Profile
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{data.riskProfile}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Audience Mode
              </span>
            </div>
            <p className="text-sm text-gray-700">{data.audienceMode}</p>
          </div>
        </div>
      </div>

      {/* Document Complexity Assessment */}
      {(data.documentComplexity || data.estimatedIssues) && (
        <div className="glass-card-strong p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-semibold text-gray-900">Pre-Analysis Assessment</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.documentComplexity && (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Complexity
                </div>
                <p className={`text-sm font-bold capitalize ${
                  data.documentComplexity === 'high' ? 'text-red-600' :
                  data.documentComplexity === 'medium' ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {data.documentComplexity}
                </p>
              </div>
            )}
            {data.estimatedIssues && (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Estimated Issues
                </div>
                <p className="text-sm font-bold text-gray-900">{data.estimatedIssues}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scope */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-brand-500" />
          <h3 className="text-base font-semibold text-gray-900">Analysis Scope</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          The following areas will be analyzed for this document type:
        </p>
        <div className="space-y-2">
          {data.allowedScope?.map((scope: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-surface-50"
            >
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-brand-600">{i + 1}</span>
              </div>
              <span className="text-sm text-gray-700">{scope}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
