'use client';

import { Matter, StageInfo, ParsedSection } from '@/lib/types';
import { FileSearch, ChevronDown, Hash, Layers } from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function ParsingStage({ matter, stage }: Props) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const data = stage.data;
  const sections: ParsedSection[] = matter.parsedSections || data?.sections || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <FileSearch className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Document Structure</h3>
            <p className="text-xs text-gray-500">
              Extracted and parsed document sections
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-center">
            <Layers className="w-5 h-5 text-brand-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">
              {data?.sectionCount || sections.length}
            </div>
            <div className="text-xs text-gray-500">Sections</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-center">
            <Hash className="w-5 h-5 text-brand-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalClauses || sections.reduce((s, sec) => s + sec.clauseCount, 0)}
            </div>
            <div className="text-xs text-gray-500">Clauses</div>
          </div>
        </div>

        {/* Section Accordion */}
        <div className="space-y-2">
          {sections.map((section, i) => (
            <div
              key={i}
              className="border border-surface-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-brand-600">
                      {section.heading.match(/^\d+/)?.[0] || i + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {section.heading}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {section.clauseCount} clauses
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSection === i ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {expandedSection === i && (
                <div className="px-4 pb-4 border-t border-surface-100">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">
                    {section.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
