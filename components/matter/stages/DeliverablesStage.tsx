'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  Package,
  Download,
  FileText,
  FileJson,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const FORMAT_ICONS: Record<string, React.ElementType> = {
  Markdown: FileText,
  JSON: FileJson,
};

export default function DeliverablesStage({ matter, stage }: Props) {
  const deliverables = matter.deliverables || [];

  const handleDownload = (deliverable: typeof deliverables[0]) => {
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
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Legal Deliverables Ready
            </h3>
            <p className="text-xs text-gray-500">
              {deliverables.length} documents prepared for download
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
        </div>
      </div>

      {/* Guardrail watermark if escalation needed */}
      {matter.guardrails?.escalationRequired && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 border-dashed">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              ⚠️ Human Review Recommended
            </span>
          </div>
          <p className="text-xs text-amber-700">
            These deliverables are watermarked as requiring human legal review before
            action is taken. See guardrails stage for details.
          </p>
        </div>
      )}

      {/* Download cards */}
      <div className="grid grid-cols-2 gap-4">
        {deliverables.map((deliverable) => {
          const FormatIcon = FORMAT_ICONS[deliverable.format] || FileText;

          return (
            <div
              key={deliverable.id}
              className="glass-card-strong p-5 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => handleDownload(deliverable)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <FormatIcon className="w-5 h-5 text-brand-600" />
                </div>
                <button className="w-8 h-8 rounded-lg bg-surface-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </button>
              </div>

              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {deliverable.name}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {deliverable.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-surface-200">
                <span className="text-[10px] text-gray-400 bg-surface-100 px-2 py-0.5 rounded-full">
                  {deliverable.format} · {deliverable.size}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(deliverable.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
