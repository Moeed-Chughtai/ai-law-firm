'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  Download,
  FileText,
  FileJson,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Scale,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const FORMAT_ICONS: Record<string, React.ElementType> = {
  Markdown: FileText,
  JSON: FileJson,
};

const FORMAT_COLORS: Record<string, string> = {
  Markdown: 'bg-brand-50 text-brand-700',
  JSON: 'bg-warning-50 text-warning-700',
};

const DELIVERABLE_ICONS: Record<string, React.ElementType> = {
  'Engagement Letter': Scale,
  'Issue Memorandum': FileText,
  'Annotated Document': FileText,
  'Risk Summary': FileJson,
  'Audit Log': Clock,
};

export default function DeliverablesStage({ matter, stage }: Props) {
  const deliverables = matter.deliverables || [];

  const handleDownload = (deliverable: (typeof deliverables)[0]) => {
    const extension = deliverable.format === 'JSON' ? 'json' : 'md';
    const mimeType = deliverable.format === 'JSON' ? 'application/json' : 'text/markdown';
    const blob = new Blob([deliverable.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deliverable.name.replace(/ /g, '_')}_${matter.id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Completion banner */}
      <div className="flex items-start gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-success-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-success-900">Analysis complete</h3>
          <p className="text-xs text-success-700 mt-1 leading-relaxed">
            Completed all {matter.stages.length} pipeline stages.{' '}
            {deliverables.length} deliverable documents ready for download.
          </p>
        </div>
      </div>

      {/* Escalation warning */}
      {matter.guardrails?.escalationRequired && (
        <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-warning-900">Human review required</h4>
            <p className="text-xs text-warning-700 mt-1 leading-relaxed">
              These deliverables require human legal review before any action is taken. Confidence threshold was not met — see Guardrails stage for details.
            </p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <div>
        <h4 className="section-label mb-3">Deliverable summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{deliverables.length}</div>
            <div className="text-[11px] text-gray-500">Documents ready</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {deliverables.filter((d) => d.format === 'Markdown').length}
            </div>
            <div className="text-[11px] text-gray-500">Markdown reports</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {deliverables.filter((d) => d.format === 'JSON').length}
            </div>
            <div className="text-[11px] text-gray-500">Structured data</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-success-600 tabular-nums">
              {matter.stages.length}
            </div>
            <div className="text-[11px] text-gray-500">Stages completed</div>
          </div>
        </div>
      </div>

      {/* Download cards */}
      <div>
        <h4 className="section-label mb-3">Download documents</h4>
        <div className="grid grid-cols-2 gap-3">
          {deliverables.map((deliverable, idx) => {
            const FormatIcon = FORMAT_ICONS[deliverable.format] || FileText;
            const formatColor = FORMAT_COLORS[deliverable.format] || 'bg-gray-50 text-gray-700';

            return (
              <div
                key={deliverable.id}
                className="card-interactive p-4 cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => handleDownload(deliverable)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formatColor}`}>
                    <FormatIcon className="w-4 h-4" />
                  </div>
                  <button className="w-7 h-7 rounded-md bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors duration-150">
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors duration-150" />
                  </button>
                </div>

                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {deliverable.name}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {deliverable.description}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${formatColor}`}>
                    {deliverable.format}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-mono">{deliverable.size}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(deliverable.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <Shield className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Important:</span> These deliverables are generated by AI and should be reviewed by qualified legal counsel before taking action. LexForge provides analysis to assist — not replace — professional legal judgment.
        </p>
      </div>
    </div>
  );
}
