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
  AlertTriangle,
  Scale,
  Clock,
  UserCheck,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function IntakeStage({ matter, stage }: Props) {
  const data = stage.data;
  if (!data) return null;

  const complexityColor =
    data.documentComplexity === 'complex'
      ? 'text-error-700 bg-error-50'
      : data.documentComplexity === 'moderate'
        ? 'text-warning-700 bg-warning-50'
        : 'text-success-700 bg-success-50';

  const conflictCheck = data.conflictCheck;
  const engagementScope = data.engagementScope;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Acceptance banner */}
      <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-success-900">Matter accepted</h3>
          <p className="text-xs text-success-700 mt-0.5">
            Conflict check cleared. Document validated and scoped. Pipeline configured.
          </p>
        </div>
      </div>

      {/* Conflict Check */}
      {conflictCheck && (
        <div>
          <h4 className="section-label mb-3">Conflict check</h4>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              {conflictCheck.cleared ? (
                <CheckCircle2 className="w-4 h-4 text-success-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning-600" />
              )}
              <span className={`text-sm font-semibold ${conflictCheck.cleared ? 'text-success-700' : 'text-warning-700'}`}>
                {conflictCheck.cleared ? 'Conflicts Cleared' : 'Potential Conflict Flagged'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{conflictCheck.notes}</p>
            {conflictCheck.partiesChecked?.length > 0 && (
              <div>
                <div className="text-[11px] text-gray-500 mb-1.5">Parties checked:</div>
                <div className="flex flex-wrap gap-1.5">
                  {conflictCheck.partiesChecked.map((party: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700">
                      <UserCheck className="w-3 h-3" />
                      {party}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matter parameters — structured table */}
      <div>
        <h4 className="section-label mb-3">Matter parameters</h4>
        <div className="card divide-y divide-gray-100">
          {[
            {
              icon: FileText,
              label: 'Document type',
              value: data.detectedDocType,
              desc: data.instrumentClassification || (
                data.detectedDocType === 'SAFE'
                  ? 'Simple Agreement for Future Equity — YC standard'
                  : 'Term Sheet — Series A preferred stock'
              ),
            },
            {
              icon: MapPin,
              label: 'Jurisdiction',
              value: data.jurisdictionConfirmed,
              desc: data.governingLaw || 'Delaware General Corporation Law (DGCL)',
            },
            {
              icon: Scale,
              label: 'Dispute resolution',
              value: data.disputeResolution || 'Not specified',
              desc: '',
            },
            {
              icon: Shield,
              label: 'Risk sensitivity',
              value: data.riskProfile,
              desc:
                matter.riskTolerance === 'low'
                  ? 'Conservative — all non-standard provisions flagged'
                  : matter.riskTolerance === 'medium'
                    ? 'Balanced — significant deviations flagged'
                    : 'Aggressive — only critical issues flagged',
            },
            {
              icon: Users,
              label: 'Output mode',
              value: data.audienceMode,
              desc:
                matter.audience === 'founder'
                  ? 'Plain-English with clear action items'
                  : 'Technical analysis with statutory citations',
            },
            {
              icon: Clock,
              label: 'Urgency',
              value: data.urgencyLevel || 'routine',
              desc: '',
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-5 py-4">
              <row.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">{row.label}</div>
                <div className="text-sm font-medium text-gray-900 capitalize mt-0.5">{row.value}</div>
              </div>
              {row.desc && (
                <span className="text-xs text-gray-400 max-w-[200px] text-right hidden sm:block">{row.desc}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Scope */}
      {engagementScope && (
        <div>
          <h4 className="section-label mb-3">Engagement scope</h4>
          <div className="card p-5 space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Client</div>
              <div className="text-sm font-medium text-gray-900">{engagementScope.clientName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Matter</div>
              <div className="text-sm text-gray-700">{engagementScope.matterDescription}</div>
            </div>
            {engagementScope.scopeOfWork?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Scope of work</div>
                <div className="space-y-1">
                  {engagementScope.scopeOfWork.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-[10px] font-mono text-gray-400 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {engagementScope.limitations?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Limitations</div>
                <div className="space-y-1">
                  {engagementScope.limitations.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {engagementScope.estimatedTimeline && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Estimated timeline</div>
                <div className="text-sm text-gray-700">{engagementScope.estimatedTimeline}</div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Preliminary flags */}
      {data.preliminaryFlags?.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Preliminary red flags</h4>
          <div className="space-y-2">
            {data.preliminaryFlags.map((flag: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-warning-50 border border-warning-100 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-warning-600 mt-0.5 shrink-0" />
                <span className="text-sm text-warning-800">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis scope */}
      <div>
        <h4 className="section-label mb-3">Analysis scope</h4>
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Based on document type, jurisdiction, and engagement scope, the following workstreams will be analyzed:
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
          <span className="font-semibold text-gray-700">Next: Document Parsing</span> — Extracting defined terms, decomposing structural sections, and identifying missing standard provisions.
        </p>
      </div>
    </div>
  );
}
