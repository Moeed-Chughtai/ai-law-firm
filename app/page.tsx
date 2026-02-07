'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Upload,
  FileText,
  Shield,
  ArrowRight,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Zap,
  Users,
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-semibold text-xl text-slate-900 tracking-tight">LexForge</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              AES-256 Encrypted
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-16">
        
        {/* Architectural Grid Layout */}
        <div className="grid grid-cols-12 gap-12">
          
          {/* Left Column: Context & Branding */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                AI Legal Associate Active
              </div>
              <h1 className="text-5xl font-serif text-slate-900 leading-[1.1]">
                Precision legal review for the modern founder.
              </h1>
              <p className="text-lg text-slate-500 font-light leading-relaxed">
                Upload your financing documents. Our autonomous agents perform a 
                comprehensive legal analysis, flagging risks and optimizing terms instantly.
              </p>
            </div>

            <div className="space-y-6 pt-8 border-t border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Multi-Pass Analysis</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Documents undergo parsing, adversarial critique, and synthesis by specialized AI agents.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Market Standard Data</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Benchmarked against thousands of YC SAFE and NVCA term sheet precedents.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="p-1 bg-slate-50 border-b border-slate-200 flex gap-1">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  New Matter Intake
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                
                {/* Document Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900">Document Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDocType('safe')}
                      className={`group relative p-4 rounded-xl border transition-all text-left ${
                        docType === 'safe'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <FileCheck className={`w-6 h-6 mb-3 ${docType === 'safe' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <div className="font-semibold">SAFE Agreement</div>
                      <div className={`text-xs mt-1 ${docType === 'safe' ? 'text-slate-300' : 'text-slate-500'}`}>Post-Money Valuation Cap</div>
                    </button>
                    
                    <button
                      onClick={() => setDocType('term_sheet')}
                      className={`group relative p-4 rounded-xl border transition-all text-left ${
                        docType === 'term_sheet'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Briefcase className={`w-6 h-6 mb-3 ${docType === 'term_sheet' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <div className="font-semibold">Term Sheet</div>
                      <div className={`text-xs mt-1 ${docType === 'term_sheet' ? 'text-slate-300' : 'text-slate-500'}`}>Series A Preferred Stock</div>
                    </button>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900">Upload Document</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                      dragOver
                        ? 'border-accent-500 bg-accent-50'
                        : fileName
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
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
                      <div className="text-center animate-fade-in">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">{fileName}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Ready for analysis</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-5 h-5 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">
                          Supports PDF, DOCX, TXT. Max 10MB.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Text Paste Toggle */}
                  <details className="group">
                    <summary className="list-none text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 flex items-center gap-1 my-2 select-none">
                      <span className="border-b border-dashed border-slate-400">Or paste text directly</span>
                    </summary>
                    <textarea
                      ref={textareaRef}
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                      placeholder="Paste document content here..."
                      className="w-full mt-2 p-4 rounded-lg border border-slate-200 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all h-32 resize-none"
                    />
                  </details>
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900">Review Persona</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setAudience('founder')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                          audience === 'founder' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        Founder
                      </button>
                      <button
                        onClick={() => setAudience('lawyer')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                          audience === 'lawyer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        Counsel
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900">Risk Sensitivity</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setRiskTolerance(level)}
                          className={`flex-1 py-2 rounded-md text-xs font-medium capitalize transition-all ${
                            riskTolerance === level 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleSubmit}
                  disabled={!documentText && !fileName}
                  className={`w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    documentText || fileName
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 translate-y-0'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      Begin Analysis
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    By proceeding, you agree that LexForge provides information, not legal advice. 
                    Your documents are processed securely and deleted after analysis.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
