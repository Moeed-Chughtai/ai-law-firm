'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Upload,
  FileText,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Zap,
  Users,
  Lock,
  ChevronRight,
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
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Legal knowledge base upload state
  const [showKnowledgeUpload, setShowKnowledgeUpload] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [knowledgeDocType, setKnowledgeDocType] = useState<'statute' | 'case_law' | 'standard_form' | 'practice_guide' | 'firm_knowledge' | 'regulation' | 'other'>('other');
  const [knowledgeUploading, setKnowledgeUploading] = useState(false);
  const [knowledgeUploadSuccess, setKnowledgeUploadSuccess] = useState('');
  const [knowledgeStats, setKnowledgeStats] = useState<Record<string, number>>({});

  // Fetch knowledge base stats on mount
  useEffect(() => {
    fetch('/api/legal-docs?stats=true')
      .then(res => res.json())
      .then(data => setKnowledgeStats(data.stats || {}))
      .catch(() => {});
  }, []);

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setUploadError('');
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      // Server-side PDF text extraction
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error || 'Failed to parse PDF');
          setFileName('');
          return;
        }
        setDocumentText(data.text);
      } catch (err) {
        setUploadError('Failed to upload file. Please try again.');
        setFileName('');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Plain text / docx — read directly
      const text = await file.text();
      setDocumentText(text);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleKnowledgeUpload = async () => {
    if (knowledgeFiles.length === 0) return;

    setKnowledgeUploading(true);
    setKnowledgeUploadSuccess('');

    try {
      const formData = new FormData();
      knowledgeFiles.forEach(file => formData.append('files', file));
      formData.append('docType', knowledgeDocType);

      const res = await fetch('/api/legal-docs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setKnowledgeUploadSuccess(
        `Successfully ingested ${data.documentsIngested} document(s) with ${data.totalChunks} chunks`
      );
      setKnowledgeFiles([]);

      const statsRes = await fetch('/api/legal-docs?stats=true');
      const statsData = await statsRes.json();
      setKnowledgeStats(statsData.stats || {});

    } catch (error) {
      setKnowledgeUploadSuccess(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setKnowledgeUploading(false);
    }
  };

  const handleSubmit = async () => {
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

  const hasDocument = documentText.trim().length > 0;

  return (
    <div className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
              <span className="font-semibold text-base text-gray-900">LegalSwarm</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowKnowledgeUpload(!showKnowledgeUpload)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Legal Knowledge Base
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Knowledge Base Upload Section (Collapsible) ── */}
      {showKnowledgeUpload && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-[1140px] mx-auto px-6 py-6">
            <div className="bg-white rounded-lg border border-blue-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Upload Legal Documents to Knowledge Base
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add statutes, case law, standard forms, and practice guides to enhance RAG retrieval
                  </p>
                </div>
                <button
                  onClick={() => setShowKnowledgeUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Document Type Selector */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  value={knowledgeDocType}
                  onChange={(e) => setKnowledgeDocType(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value="statute">Statute (DGCL, UCC, Securities Act)</option>
                  <option value="case_law">Case Law (Court decisions, precedents)</option>
                  <option value="standard_form">Standard Form (NVCA, ABA templates)</option>
                  <option value="practice_guide">Practice Guide (Treatises, commentaries)</option>
                  <option value="firm_knowledge">Firm Knowledge (Internal memos, playbooks)</option>
                  <option value="regulation">Regulation (SEC rules, state regs)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Files</label>
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setKnowledgeFiles(files);
                    setKnowledgeUploadSuccess('');
                  }}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {knowledgeFiles.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {knowledgeFiles.length} file(s) selected: {knowledgeFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleKnowledgeUpload}
                disabled={knowledgeFiles.length === 0 || knowledgeUploading}
                className={`w-full py-2 rounded-md text-xs font-semibold transition-all ${
                  knowledgeFiles.length > 0 && !knowledgeUploading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {knowledgeUploading ? (
                  <>
                    <div className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Ingesting documents...
                  </>
                ) : (
                  `Ingest ${knowledgeFiles.length || 0} document(s) into RAG`
                )}
              </button>

              {/* Success/Error Message */}
              {knowledgeUploadSuccess && (
                <div className={`mt-3 p-2 rounded text-xs ${
                  knowledgeUploadSuccess.startsWith('Successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {knowledgeUploadSuccess}
                </div>
              )}

              {/* Knowledge Base Stats */}
              {Object.keys(knowledgeStats).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Current Knowledge Base:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(knowledgeStats).map(([type, count]) => (
                      <div key={type} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-semibold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1140px] mx-auto px-6 py-16">
        {/* ── Page Header ── */}
        <div className="max-w-xl mb-12">
          <h1 className="text-display-sm text-gray-900 font-semibold">
            New matter intake
          </h1>
          <p className="mt-3 text-base text-gray-500 leading-relaxed">
            Upload a financing document for automated legal review. Our pipeline parses, 
            analyzes, and benchmarks your terms against market standards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Form Column ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Document Type */}
            <div className="space-y-3">
              <label className="section-label">Document type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDocType('safe')}
                  className={`group p-4 rounded-lg border text-left transition-all duration-150 ${
                    docType === 'safe'
                      ? 'border-brand-600 bg-brand-25 shadow-ring-brand'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileCheck className={`w-5 h-5 ${docType === 'safe' ? 'text-brand-600' : 'text-gray-400'}`} />
                    {docType === 'safe' && (
                      <div className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-sm text-gray-900">SAFE Agreement</div>
                  <div className="text-xs text-gray-500 mt-0.5">Post-money valuation cap</div>
                </button>

                <button
                  onClick={() => setDocType('term_sheet')}
                  className={`group p-4 rounded-lg border text-left transition-all duration-150 ${
                    docType === 'term_sheet'
                      ? 'border-brand-600 bg-brand-25 shadow-ring-brand'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileText className={`w-5 h-5 ${docType === 'term_sheet' ? 'text-brand-600' : 'text-gray-400'}`} />
                    {docType === 'term_sheet' && (
                      <div className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-sm text-gray-900">Term Sheet</div>
                  <div className="text-xs text-gray-500 mt-0.5">Series A preferred stock</div>
                </button>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="space-y-3">
              <label className="section-label">Upload document</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                  dragOver
                    ? 'border-brand-400 bg-brand-25'
                    : fileName
                      ? 'border-success-400 bg-success-25'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-25'
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
                    {isUploading ? (
                      <>
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{fileName}</p>
                        <p className="text-xs text-brand-600 mt-1">Extracting text from PDF…</p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-5 h-5 text-success-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{fileName}</p>
                        <p className="text-xs text-success-600 mt-1">Ready for analysis</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload <span className="text-gray-500 font-normal">or drag and drop</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">PDF, DOCX, or TXT up to 10 MB</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error-50 border border-error-200 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-error-600 shrink-0" />
                  <p className="text-xs text-error-700">{uploadError}</p>
                </div>
              )}

              <details className="group">
                <summary className="list-none text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1 py-1 select-none">
                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                  Paste text directly
                </summary>
                <textarea
                  ref={textareaRef}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste your document content here..."
                  className="input-field mt-2 font-mono text-xs h-32 resize-none"
                />
              </details>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="section-label">Review persona</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setAudience('founder')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                      audience === 'founder' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    Founder
                  </button>
                  <button
                    onClick={() => setAudience('lawyer')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                      audience === 'lawyer' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    Counsel
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="section-label">Risk sensitivity</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskTolerance(level)}
                      className={`flex-1 py-2 rounded-md text-xs font-medium capitalize transition-all duration-150 ${
                        riskTolerance === level
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-4 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!hasDocument || isSubmitting || isUploading}
                className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
                  hasDocument && !isSubmitting && !isUploading
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-xs'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Begin analysis
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  LegalSwarm provides information, not legal advice. Documents are processed
                  securely and deleted after analysis completes.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar — Process Overview ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="card p-5 space-y-5">
                <h3 className="text-sm font-semibold text-gray-900">How it works</h3>

                <div className="space-y-4">
                  {[
                    { step: '01', title: 'Document parsing', desc: 'Structured extraction of clauses, terms, and key provisions' },
                    { step: '02', title: 'Issue analysis', desc: 'Each clause evaluated against market standards and best practices' },
                    { step: '03', title: 'Research & benchmarking', desc: 'RAG-powered comparison with YC SAFE and NVCA precedents' },
                    { step: '04', title: 'Adversarial review', desc: 'Multi-perspective critique identifies hidden risks' },
                    { step: '05', title: 'Deliverables', desc: 'Executive memo, redline markup, and negotiation playbook' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="text-xs font-mono text-gray-400 pt-0.5 shrink-0">{item.step}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5" />
                    SOC 2 compliant infrastructure
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                    AES-256 encryption at rest
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
