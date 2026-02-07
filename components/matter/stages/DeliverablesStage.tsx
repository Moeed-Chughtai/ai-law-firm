'use client';

import { Matter, StageInfo } from '@/lib/types';
import {
  Package,
  Download,
  FileText,
  FileJson,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Shield,
  Sparkles,
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
  Markdown: 'bg-violet-100 text-violet-700 border-violet-200',
  JSON: 'bg-amber-100 text-amber-700 border-amber-200',
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
    <div className="space-y-8 animate-slide-up">
      {/* Completion Banner */}
      <div className="flex items-start gap-4 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-semibold text-emerald-900">Analysis Complete</h3>
          <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
            Your legal analysis has been completed through all {matter.stages.length} pipeline stages. 
            {deliverables.length} deliverable documents are ready for download.
          </p>
        </div>
      </div>

      {/* Guardrail watermark if escalation needed */}
      {matter.guardrails?.escalationRequired && (
        <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Human Review Required</h4>
              <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                These deliverables are watermarked as requiring human legal review before any action is taken. 
                The automated confidence threshold was not met — see the Guardrails stage for specific details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Deliverable Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">{deliverables.length}</div>
            <div className="text-xs text-slate-500 mt-1">Documents Ready</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">
              {deliverables.filter(d => d.format === 'Markdown').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Markdown Reports</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-serif font-bold text-slate-900">
              {deliverables.filter(d => d.format === 'JSON').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Structured Data</div>
          </div>
        </div>
      </div>

      {/* Download cards */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Download Documents</h4>
        <div className="grid grid-cols-2 gap-4">
          {deliverables.map((deliverable, idx) => {
            const FormatIcon = FORMAT_ICONS[deliverable.format] || FileText;
            const formatColor = FORMAT_COLORS[deliverable.format] || 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={deliverable.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => handleDownload(deliverable)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${formatColor}`}>
                      <FormatIcon className="w-5 h-5" />
                    </div>
                    <button className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-slate-900 flex items-center justify-center transition-colors">
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 mb-1.5">
                    {deliverable.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {deliverable.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${formatColor}`}>
                      {deliverable.format}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">{deliverable.size}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(deliverable.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Important:</span> These deliverables are generated by AI and should be reviewed by qualified legal counsel before taking action. 
              LexForge provides analysis to assist — not replace — professional legal judgment. 
              All recommendations are based on the document text provided and publicly available legal standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
