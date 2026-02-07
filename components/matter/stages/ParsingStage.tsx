'use client';

import { Matter, StageInfo, ParsedSection } from '@/lib/types';
import {
  ChevronDown,
  Hash,
  Layers,
  BookOpen,
  ArrowRight,
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
      {/* Structure overview metrics */}
      <div>
        <h4 className="section-label mb-3">Document structure</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card text-center">
            <Layers className="w-4 h-4 text-gray-400 mx-auto mb-2" />
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {data?.sectionCount || sections.length}
            </div>
            <div className="text-[11px] text-gray-500">Sections</div>
          </div>
          <div className="metric-card text-center">
            <Hash className="w-4 h-4 text-gray-400 mx-auto mb-2" />
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{totalClauses}</div>
            <div className="text-[11px] text-gray-500">Clauses</div>
          </div>
          <div className="metric-card text-center">
            <BookOpen className="w-4 h-4 text-gray-400 mx-auto mb-2" />
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {totalWords > 0 ? `${(totalWords / 1000).toFixed(1)}k` : '—'}
            </div>
            <div className="text-[11px] text-gray-500">Words</div>
          </div>
        </div>
      </div>

      {/* Clause distribution */}
      {sections.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Clause distribution</h4>
          <div className="card p-5">
            <div className="space-y-2.5">
              {sections.map((section, i) => {
                const pct = totalClauses > 0 ? (section.clauseCount / totalClauses) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 truncate shrink-0">{section.heading}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-800 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-mono w-6 text-right tabular-nums">{section.clauseCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section accordion */}
      <div>
        <h4 className="section-label mb-3">Parsed sections</h4>
        <div className="space-y-1.5">
          {sections.map((section, i) => {
            const wordCount = section.content?.split(/\s+/).length || 0;
            return (
              <div
                key={i}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-400 w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{section.heading}</span>
                      <span className="text-[10px] text-gray-400 ml-2">
                        {section.clauseCount} clauses · {wordCount} words
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSection === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedSection === i && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3 whitespace-pre-line font-mono text-xs">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Issue Analysis</span> — Each clause evaluated against legal standards and market norms to identify risks and non-standard provisions.
        </p>
      </div>
    </div>
  );
}
