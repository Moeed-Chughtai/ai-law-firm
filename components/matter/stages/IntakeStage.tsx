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
  AlertTriangle,
  Gauge,
  ArrowRight,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function IntakeStage({ matter, stage }: Props) {
  const data = stage.data;

  if (!data) return null;

  const complexityColor = data.documentComplexity === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
    data.documentComplexity === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-emerald-600 bg-emerald-50 border-emerald-200';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Acceptance Banner */}
      <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-emerald-900">Matter Accepted for Review</h3>
          <p className="text-sm text-emerald-700 mt-0.5">
            Your document has been validated and scoped. The analysis pipeline is now configured.
          </p>
        </div>
      </div>

      {/* Matter Parameters — 2x2 Grid */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Matter Parameters</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Type</span>
            </div>
            <p className="text-lg font-serif font-semibold text-slate-900">{data.detectedDocType}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.detectedDocType === 'SAFE' 
                ? 'Simple Agreement for Future Equity — standard YC-format instrument'
                : 'Venture Capital Term Sheet — Series A preferred stock financing'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurisdiction</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-serif font-semibold text-slate-900">{data.jurisdictionConfirmed}</p>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Governed by Delaware General Corporation Law (DGCL)</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Sensitivity</span>
            </div>
            <p className="text-lg font-serif font-semibold text-slate-900 capitalize">{data.riskProfile}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.riskProfile === 'low' ? 'Conservative — all non-standard provisions flagged' :
               data.riskProfile === 'medium' ? 'Balanced — significant deviations from market terms flagged' :
               'Aggressive — only critical, deal-breaking issues flagged'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Mode</span>
            </div>
            <p className="text-lg font-serif font-semibold text-slate-900 capitalize">{data.audienceMode}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.audienceMode === 'Founder' || data.audienceMode === 'founder'
                ? 'Plain-English explanations with clear action items'
                : 'Technical legal analysis with statutory citations'}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-Analysis Assessment */}
      {(data.documentComplexity || data.estimatedIssues) && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Pre-Analysis Assessment</h4>
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="grid grid-cols-3 gap-6">
              {data.documentComplexity && (
                <div className="text-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold mb-2 ${complexityColor}`}>
                    <Gauge className="w-4 h-4" />
                    <span className="capitalize">{data.documentComplexity}</span>
                  </div>
                  <p className="text-xs text-slate-500">Document Complexity</p>
                </div>
              )}
              {data.estimatedIssues && (
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-slate-900 mb-1">{data.estimatedIssues}</div>
                  <p className="text-xs text-slate-500">Estimated Issues</p>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-serif font-bold text-slate-900 mb-1">9</div>
                <p className="text-xs text-slate-500">Analysis Stages</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Scope */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Analysis Scope</h4>
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Based on the document type and jurisdiction, the following legal dimensions will be systematically analyzed:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {data.allowedScope?.map((scope: string, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-700 font-medium">{scope}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Document Parsing</span> — Your document will be decomposed into its structural sections and individual clauses for systematic clause-by-clause analysis.
        </p>
      </div>
    </div>
  );
}
