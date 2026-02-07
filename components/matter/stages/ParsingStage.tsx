'use client';

import { Matter, StageInfo, ParsedSection } from '@/lib/types';
import {
  FileSearch,
  ChevronDown,
  Hash,
  Layers,
  BookOpen,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function ParsingStage({ matter, stage }: Props) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const data = stage.data;
  const sections: ParsedSection[] = matter.parsedSections || data?.sections || [];
  const totalClauses = data?.totalClauses || sections.reduce((s, sec) => s + sec.clauseCount, 0);
  const totalWords = sections.reduce((s, sec) => s + (sec.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Structure Overview */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Document Structure</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-2xl font-serif font-bold text-slate-900">
              {data?.sectionCount || sections.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Sections Identified</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Hash className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-2xl font-serif font-bold text-slate-900">{totalClauses}</div>
            <div className="text-xs text-slate-500 mt-1">Legal Clauses</div>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-2xl font-serif font-bold text-slate-900">
              {totalWords > 0 ? `${(totalWords / 1000).toFixed(1)}k` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Words Analyzed</div>
          </div>
        </div>
      </div>

      {/* Visual clause distribution */}
      {sections.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Clause Distribution</h4>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="space-y-3">
              {sections.map((section, i) => {
                const pct = totalClauses > 0 ? (section.clauseCount / totalClauses) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-32 truncate shrink-0 font-medium">{section.heading}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-slate-800 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-[9px] font-bold text-white">{section.clauseCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-right">
              Each bar represents clause density per section — longer bars indicate more complex sections
            </p>
          </div>
        </div>
      )}

      {/* Section Accordion */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Parsed Sections</h4>
        <div className="space-y-2">
          {sections.map((section, i) => {
            const wordCount = section.content?.split(/\s+/).length || 0;
            return (
              <div
                key={i}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">
                        {section.heading.match(/^\d+/)?.[0] || i + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-900 block">
                        {section.heading}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {section.clauseCount} clauses · ~{wordCount} words
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                {expandedSection === i && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="flex items-center gap-2 py-3 mb-3 border-b border-slate-100">
                      <BarChart3 className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-medium">
                        {section.clauseCount} individual clauses extracted · {wordCount} words
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Issue Analysis</span> — Each clause will be evaluated against legal standards and market norms to identify risks, missing protections, and non-standard provisions.
        </p>
      </div>
    </div>
  );
}
