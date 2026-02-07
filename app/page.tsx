'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Upload,
  FileText,
  Shield,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Building2,
  Users,
  Zap,
} from 'lucide-react';

type DocType = 'safe' | 'term_sheet';
type RiskTolerance = 'low' | 'medium' | 'high';
type Audience = 'founder' | 'lawyer';

export default function IntakePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [docType, setDocType] = useState<DocType>('safe');
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('medium');
  const [audience, setAudience] = useState<Audience>('founder');
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setDocumentText(text);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async () => {
    // Also check the textarea DOM value for browser automation compatibility
    const textValue = documentText.trim() || textareaRef.current?.value?.trim() || '';
    if (!textValue) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          riskTolerance,
          audience,
          documentText: textValue,
          fileName: fileName || undefined,
        }),
      });

      const data = await res.json();
      router.push(`/matter/${data.id}`);
    } catch (error) {
      console.error('Failed to create matter:', error);
      setIsSubmitting(false);
    }
  };

  const riskLabels: Record<RiskTolerance, { label: string; desc: string; color: string }> = {
    low: {
      label: 'Conservative',
      desc: 'Flag everything. Prioritize protection over speed.',
      color: 'text-emerald-600',
    },
    medium: {
      label: 'Balanced',
      desc: 'Flag significant issues. Balance thoroughness with practicality.',
      color: 'text-brand-600',
    },
    high: {
      label: 'Aggressive',
      desc: 'Focus on critical issues only. Optimize for deal velocity.',
      color: 'text-amber-600',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-50">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">LexForge</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                AI-Native Startup Law Firm
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Confidential & Secure</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Multi-Agent Legal Analysis Pipeline
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Legal review that moves at the
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              {' '}
              speed of your startup
            </span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg leading-relaxed">
            Upload your SAFE or Term Sheet. Our AI legal team analyzes, researches, redlines,
            and delivers — with full transparency at every step.
          </p>
        </div>
      </section>

      {/* Main Form */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="glass-card-strong p-8">
          {/* Document Type */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDocType('safe')}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  docType === 'safe'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    docType === 'safe' ? 'bg-brand-100' : 'bg-surface-100'
                  }`}
                >
                  <FileText
                    className={`w-5 h-5 ${
                      docType === 'safe' ? 'text-brand-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900">SAFE</div>
                  <div className="text-xs text-gray-500">Simple Agreement for Future Equity</div>
                </div>
                {docType === 'safe' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => setDocType('term_sheet')}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  docType === 'term_sheet'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    docType === 'term_sheet' ? 'bg-brand-100' : 'bg-surface-100'
                  }`}
                >
                  <FileText
                    className={`w-5 h-5 ${
                      docType === 'term_sheet' ? 'text-brand-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900">Term Sheet</div>
                  <div className="text-xs text-gray-500">Venture Capital Term Sheet</div>
                </div>
                {docType === 'term_sheet' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Jurisdiction
            </label>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 bg-surface-50">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Delaware</span>
              <span className="ml-auto text-xs text-gray-400 bg-surface-200 px-2 py-0.5 rounded-full">
                Locked
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Currently optimized for Delaware corporate law — the standard for VC-backed startups.
            </p>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-400 bg-brand-50/50'
                  : fileName
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-surface-300 hover:border-brand-300 hover:bg-brand-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{fileName}</div>
                    <div className="text-xs text-emerald-600">Ready for review</div>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">
                    Drop your document here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports PDF, DOCX, or TXT files
                  </p>
                </>
              )}
            </div>

            {/* Or paste text */}
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-surface-200" />
                <span className="text-xs text-gray-400 font-medium">or paste document text</span>
                <div className="h-px flex-1 bg-surface-200" />
              </div>
              <textarea
                ref={textareaRef}
                value={documentText}
                onChange={(e) => {
                  setDocumentText(e.target.value);
                  if (!fileName) setFileName('');
                }}
                onInput={(e) => {
                  // Fallback for browser automation that may not trigger onChange
                  const val = (e.target as HTMLTextAreaElement).value;
                  if (val && !documentText) setDocumentText(val);
                }}
                placeholder="Paste your SAFE or Term Sheet text here..."
                rows={5}
                className="w-full rounded-xl border border-surface-200 bg-white p-4 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none transition-all"
              />
            </div>
          </div>

          {/* Risk Tolerance */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Risk Tolerance
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as RiskTolerance[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskTolerance(level)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    riskTolerance === level
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                      : 'border-surface-200 hover:border-surface-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold ${riskLabels[level].color}`}>
                    {riskLabels[level].label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {riskLabels[level].desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAudience('founder')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  audience === 'founder'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <Zap className={`w-5 h-5 ${audience === 'founder' ? 'text-brand-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Founder</div>
                  <div className="text-xs text-gray-500">Plain English, actionable</div>
                </div>
              </button>
              <button
                onClick={() => setAudience('lawyer')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  audience === 'lawyer'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <Users className={`w-5 h-5 ${audience === 'lawyer' ? 'text-brand-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Lawyer</div>
                  <div className="text-xs text-gray-500">Technical legal analysis</div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!documentText.trim() || isSubmitting}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-semibold transition-all ${
              documentText.trim() && !isSubmitting
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30'
                : 'bg-surface-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initiating Legal Review...
              </>
            ) : (
              <>
                Start Legal Review
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Disclaimer */}
          <div className="mt-6 flex items-start gap-2 p-4 rounded-xl bg-amber-50/80 border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Disclaimer:</strong> LexForge provides AI-assisted legal analysis for
              informational purposes only. This does not constitute legal advice, and no
              attorney-client relationship is formed. Always consult with qualified legal counsel
              before making decisions based on this analysis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
