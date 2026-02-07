'use client';

import { Matter, StageInfo, ParsedSection, DefinedTerm, MissingProvision } from '@/lib/types';
import {
  ChevronDown,
  Hash,
  Layers,
  BookOpen,
  ArrowRight,
  BookMarked,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link2,
  FileWarning,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function ParsingStage({ matter, stage }: Props) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'sections' | 'terms' | 'missing'>('sections');
  const data = stage.data;
  const sections: ParsedSection[] = matter.parsedSections || data?.sections || [];
  const definedTerms: DefinedTerm[] = matter.definedTerms || data?.definedTerms || [];
  const missingProvisions: MissingProvision[] = matter.missingProvisions || data?.missingProvisions || [];
  const totalClauses = data?.totalClauses || sections.reduce((s, sec) => s + sec.clauseCount, 0);
  const totalWords = sections.reduce((s, sec) => s + (sec.content?.split(/\s+/).length || 0), 0);
  const nonStandardTerms = definedTerms.filter((t) => !t.isStandard);
  const criticalMissing = missingProvisions.filter((p) => p.importance === 'critical' || p.importance === 'high');

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Structure overview metrics */}
      <div>
        <h4 className="section-label mb-3">Document structure</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <BookMarked className="w-4 h-4 text-gray-400 mx-auto mb-2" />
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{definedTerms.length}</div>
            <div className="text-[11px] text-gray-500">Defined terms</div>
          </div>
          <div className="metric-card text-center">
            <FileWarning className="w-4 h-4 text-gray-400 mx-auto mb-2" />
            <div className={`text-xl font-semibold tabular-nums ${criticalMissing.length > 0 ? 'text-warning-600' : 'text-success-600'}`}>
              {missingProvisions.length}
            </div>
            <div className="text-[11px] text-gray-500">Missing provisions</div>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          { key: 'sections', label: 'Sections', count: sections.length },
          { key: 'terms', label: 'Defined Terms', count: definedTerms.length },
          { key: 'missing', label: 'Missing Provisions', count: missingProvisions.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
              activeView === key
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeView === key ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Sections view */}
      {activeView === 'sections' && (
        <>
          {/* Clause distribution */}
          {sections.length > 0 && (
            <div>
              <h4 className="section-label mb-3">Clause distribution</h4>
              <div className="card p-5">
                <div className="space-y-2.5">
                  {sections.map((section, i) => {
                    const pct = totalClauses > 0 ? (section.clauseCount / totalClauses) * 100 : 0;
                    const hasDeviation = section.deviationFromStandard && section.deviationFromStandard !== 'none';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 truncate shrink-0">{section.heading}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${hasDeviation ? 'bg-warning-500' : 'bg-gray-800'}`}
                            style={{ width: `${Math.max(pct, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-6 text-right tabular-nums">{section.clauseCount}</span>
                        {hasDeviation && (
                          <AlertTriangle className="w-3 h-3 text-warning-500 shrink-0" />
                        )}
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
                const hasDeviation = section.deviationFromStandard && section.deviationFromStandard !== 'none';
                return (
                  <div key={i} className="card overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        {hasDeviation && (
                          <span className="text-[10px] font-medium text-warning-700 bg-warning-50 px-2 py-0.5 rounded-md ring-1 ring-inset ring-warning-200">
                            Non-standard
                          </span>
                        )}
                        {section.crossReferences && section.crossReferences.length > 0 && (
                          <span className="text-[10px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md ring-1 ring-inset ring-brand-200 flex items-center gap-0.5">
                            <Link2 className="w-2.5 h-2.5" />
                            {section.crossReferences.length}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === i ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {expandedSection === i && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        {/* Metadata */}
                        {((section.operativeVerbs?.length ?? 0) > 0 || (section.blankFields?.length ?? 0) > 0 || (section.crossReferences?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-2 pt-3 pb-2">
                            {section.operativeVerbs?.map((verb: string, vi: number) => (
                              <span key={vi} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{verb}</span>
                            ))}
                            {section.blankFields?.map((field: string, fi: number) => (
                              <span key={fi} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-error-50 text-error-700">⬜ {field}</span>
                            ))}
                          </div>
                        )}
                        {(section.crossReferences?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 pb-2">
                            <Link2 className="w-3 h-3 text-brand-500" />
                            <span className="text-[10px] text-brand-600">
                              Cross-references: {section.crossReferences!.join(', ')}
                            </span>
                          </div>
                        )}
                        {hasDeviation && (
                          <div className="flex items-start gap-1.5 p-2 mb-2 rounded bg-warning-50 border border-warning-100">
                            <AlertTriangle className="w-3 h-3 text-warning-600 mt-0.5 shrink-0" />
                            <span className="text-[10px] text-warning-700">{section.deviationFromStandard}</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 leading-relaxed pt-1 whitespace-pre-line font-mono text-xs">
                          {section.content}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Defined Terms view */}
      {activeView === 'terms' && definedTerms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="section-label">Defined terms registry</h4>
            {nonStandardTerms.length > 0 && (
              <span className="text-[10px] font-medium text-warning-700 bg-warning-50 px-2 py-0.5 rounded-md ring-1 ring-inset ring-warning-200">
                {nonStandardTerms.length} non-standard
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {definedTerms.map((term, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">&ldquo;{term.term}&rdquo;</h4>
                    {term.isStandard ? (
                      <span className="text-[10px] font-medium text-success-700 bg-success-50 px-1.5 py-0.5 rounded-md ring-1 ring-inset ring-success-200 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Standard
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-warning-700 bg-warning-50 px-1.5 py-0.5 rounded-md ring-1 ring-inset ring-warning-200 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Non-standard
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
                    {term.section}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{term.definition}</p>
                {term.concerns && (
                  <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-warning-50 border border-warning-100">
                    <AlertTriangle className="w-3 h-3 text-warning-600 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-warning-700">{term.concerns}</span>
                  </div>
                )}
                {term.crossReferences?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Link2 className="w-3 h-3 text-brand-500" />
                    <span className="text-[10px] text-brand-600">
                      Used in: {term.crossReferences.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Provisions view */}
      {activeView === 'missing' && missingProvisions.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Missing standard provisions</h4>
          <div className="space-y-2">
            {missingProvisions.map((provision, i) => {
              const importanceColor =
                provision.importance === 'critical'
                  ? 'severity-critical'
                  : provision.importance === 'high'
                    ? 'severity-high'
                    : provision.importance === 'medium'
                      ? 'severity-medium'
                      : 'severity-low';
              return (
                <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h4 className="text-sm font-medium text-gray-900">{provision.provision}</h4>
                    <span className={`severity-badge shrink-0 ${importanceColor}`}>
                      {provision.importance}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{provision.explanation}</p>
                  {provision.standardLanguage && (
                    <div className="p-2.5 rounded-md bg-gray-900 mt-2">
                      <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Suggested standard language</div>
                      <p className="text-xs text-gray-200 leading-relaxed font-mono">{provision.standardLanguage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internal consistency issues */}
      {data?.internalConsistencyIssues?.length > 0 && (
        <div>
          <h4 className="section-label mb-3">Internal consistency issues</h4>
          <div className="space-y-2">
            {data.internalConsistencyIssues.map((issue: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-warning-50 border border-warning-100 rounded-lg">
                <XCircle className="w-3.5 h-3.5 text-warning-600 mt-0.5 shrink-0" />
                <span className="text-sm text-warning-800">{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Issue Analysis</span> — Each clause evaluated against legal standards and market norms, with cross-clause interaction analysis and statutory basis identification.
        </p>
      </div>
    </div>
  );
}
