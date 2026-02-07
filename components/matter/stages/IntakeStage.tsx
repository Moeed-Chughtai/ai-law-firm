'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  CheckCircle2,
  MapPin,
  FileText,
  Shield,
  Users,
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

  const complexityColor =
    data.documentComplexity === 'high'
      ? 'text-error-700 bg-error-50'
      : data.documentComplexity === 'medium'
        ? 'text-warning-700 bg-warning-50'
        : 'text-success-700 bg-success-50';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Acceptance banner */}
      <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-success-900">Matter accepted</h3>
          <p className="text-xs text-success-700 mt-0.5">
            Document validated and scoped. The analysis pipeline is now configured.
          </p>
        </div>
      </div>

      {/* Matter parameters — structured table */}
      <div>
        <h4 className="section-label mb-3">Matter parameters</h4>
        <div className="card divide-y divide-gray-100">
          {[
            {
              icon: FileText,
              label: 'Document type',
              value: data.detectedDocType,
              desc:
                data.detectedDocType === 'SAFE'
                  ? 'Simple Agreement for Future Equity — YC standard'
                  : 'Term Sheet — Series A preferred stock',
            },
            {
              icon: MapPin,
              label: 'Jurisdiction',
              value: data.jurisdictionConfirmed,
              desc: 'Delaware General Corporation Law (DGCL)',
            },
            {
              icon: Shield,
              label: 'Risk sensitivity',
              value: data.riskProfile,
              desc:
                data.riskProfile === 'low'
                  ? 'Conservative — all non-standard provisions flagged'
                  : data.riskProfile === 'medium'
                    ? 'Balanced — significant deviations flagged'
                    : 'Aggressive — only critical issues flagged',
            },
            {
              icon: Users,
              label: 'Output mode',
              value: data.audienceMode,
              desc:
                data.audienceMode === 'Founder' || data.audienceMode === 'founder'
                  ? 'Plain-English with clear action items'
                  : 'Technical analysis with statutory citations',
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-5 py-4">
              <row.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">{row.label}</div>
                <div className="text-sm font-medium text-gray-900 capitalize mt-0.5">{row.value}</div>
              </div>
              <span className="text-xs text-gray-400 max-w-[200px] text-right hidden sm:block">{row.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-analysis assessment */}
      {(data.documentComplexity || data.estimatedIssues) && (
        <div>
          <h4 className="section-label mb-3">Pre-analysis assessment</h4>
          <div className="grid grid-cols-3 gap-3">
            {data.documentComplexity && (
              <div className="metric-card text-center">
                <div className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold capitalize mb-1 ${complexityColor}`}>
                  {data.documentComplexity}
                </div>
                <div className="text-[11px] text-gray-500">Complexity</div>
              </div>
            )}
            {data.estimatedIssues && (
              <div className="metric-card text-center">
                <div className="text-xl font-semibold text-gray-900 tabular-nums">{data.estimatedIssues}</div>
                <div className="text-[11px] text-gray-500">Est. issues</div>
              </div>
            )}
            <div className="metric-card text-center">
              <div className="text-xl font-semibold text-gray-900 tabular-nums">9</div>
              <div className="text-[11px] text-gray-500">Pipeline stages</div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis scope */}
      <div>
        <h4 className="section-label mb-3">Analysis scope</h4>
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Based on document type and jurisdiction, the following dimensions will be analyzed:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.allowedScope?.map((scope: string, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-gray-50 border border-gray-100"
              >
                <span className="text-[10px] font-mono text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-gray-700">{scope}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Document Parsing</span> — Decomposing into structural sections and individual clauses for systematic analysis.
        </p>
      </div>
    </div>
  );
}
