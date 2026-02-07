'use client';

import { Matter, StageInfo, Severity } from '@/lib/types';
import { PenTool, Eye, FileText } from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
};

export default function DraftingStage({ matter, stage }: Props) {
  const [viewMode, setViewMode] = useState<'plain' | 'lawyer'>(
    matter.audience === 'founder' ? 'plain' : 'lawyer'
  );
  const issues = matter.issues || [];
  const issuesWithRedlines = issues.filter((i) => i.redline);
  const actionableRedlines = issuesWithRedlines.filter(
    (i) => !i.redline?.includes('No changes needed') && !i.redline?.includes('No redline required')
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <PenTool className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Annotated Redline Draft
              </h3>
              <p className="text-xs text-gray-500">
                {actionableRedlines.length} clauses with suggested changes
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('plain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'plain'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Plain English
            </button>
            <button
              onClick={() => setViewMode('lawyer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'lawyer'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Lawyer View
            </button>
          </div>
        </div>
      </div>

      {/* Redlines */}
      <div className="space-y-4">
        {issuesWithRedlines.map((issue) => (
          <div key={issue.id} className="glass-card-strong p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
              <span className="text-sm font-semibold text-gray-900">
                {issue.title}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{issue.clauseRef}</span>
            </div>

            <div className="redline p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div
                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: (issue.redline || '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/~~(.*?)~~/g, '<del>$1</del>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/✅/g, '<span class="text-emerald-500">✅</span>')
                    .replace(/\n/g, '<br/>'),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
