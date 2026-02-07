'use client';

import { Matter, StageInfo, Issue } from '@/lib/types';
import {
  Search,
  ChevronDown,
  Globe,
  AlertTriangle,
  Scale,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const TAB_INFO: Record<string, { icon: React.ElementType; label: string }> = {
  marketNorms: { icon: Globe, label: 'Market norms' },
  riskImpact: { icon: AlertTriangle, label: 'Risk impact' },
  negotiationLeverage: { icon: Scale, label: 'Negotiation' },
  precedents: { icon: BookOpen, label: 'Legal authority' },
};

export default function ResearchStage({ matter, stage }: Props) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const issues = matter.issues || [];
  const isRunning = stage.status === 'running';

  const completedResearch = issues.filter((i) => i.research).length;

  const getActiveTab = (issueId: string) => activeTab[issueId] || 'marketNorms';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Research overview */}
      <div>
        <h4 className="section-label mb-3">Research agents</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">4</div>
            <div className="text-[11px] text-gray-500">Parallel agents</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{completedResearch * 4}</div>
            <div className="text-[11px] text-gray-500">Total runs</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-gray-900 tabular-nums">
              {completedResearch}/{issues.length}
            </div>
            <div className="text-[11px] text-gray-500">Issues covered</div>
          </div>
          <div className="metric-card text-center">
            <div className="text-xl font-semibold text-brand-600 tabular-nums">
              {issues.filter((i) => i.research?.precedents).length}
            </div>
            <div className="text-[11px] text-gray-500">With precedents</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedResearch / Math.max(issues.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Agent descriptions */}
      <div className="card p-4">
        <h4 className="section-label mb-2">Specialist agents</h4>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { icon: Globe, label: 'Market Norms', desc: 'NVCA/YC standard comparisons' },
            { icon: AlertTriangle, label: 'Risk Impact', desc: 'Scenario modeling & worst-case analysis' },
            { icon: Scale, label: 'Negotiation', desc: 'Leverage points & counter-positions' },
            { icon: BookOpen, label: 'Legal Authority', desc: 'DGCL provisions, case law & SEC guidance' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2 p-2 rounded-md bg-gray-50">
              <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-gray-900">{label}</div>
                <div className="text-[10px] text-gray-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-issue research */}
      <div>
        <h4 className="section-label mb-3">Research by issue</h4>
        <div className="space-y-1.5">
          {issues.map((issue) => (
            <div key={issue.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      issue.research ? 'bg-success-500' : isRunning ? 'bg-brand-500 animate-pulse' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`severity-badge ${
                        issue.severity === 'critical' ? 'severity-critical'
                          : issue.severity === 'high' ? 'severity-high'
                            : issue.severity === 'medium' ? 'severity-medium'
                              : issue.severity === 'low' ? 'severity-low' : 'severity-info'
                      }`}>{issue.severity}</span>
                      <span className="text-[10px] font-mono text-gray-400">{issue.clauseRef}</span>
                      {issue.category && (
                        <span className="text-[10px] text-gray-400">{issue.category.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {issue.research && (
                    <span className="text-[10px] font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-md ring-1 ring-inset ring-success-200">
                      4 agents
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedIssue === issue.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedIssue === issue.id && issue.research && (
                <div className="border-t border-gray-100 p-4">
                  {/* Tabs */}
                  <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                    {Object.entries(TAB_INFO).map(([key, { icon: Icon, label }]) => {
                      // Only show precedents tab if data exists
                      if (key === 'precedents' && !issue.research?.precedents) return null;
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveTab({ ...activeTab, [issue.id]: key })}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                            getActiveTab(issue.id) === key
                              ? 'bg-white text-gray-900 shadow-xs'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {getActiveTab(issue.id) === 'marketNorms' && issue.research.marketNorms}
                      {getActiveTab(issue.id) === 'riskImpact' && issue.research.riskImpact}
                      {getActiveTab(issue.id) === 'negotiationLeverage' && issue.research.negotiationLeverage}
                      {getActiveTab(issue.id) === 'precedents' && issue.research.precedents}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Next: Synthesis</span> — Research triangulated into actionable recommendations with primary actions, fallback positions, and walk-away thresholds.
        </p>
      </div>
    </div>
  );
}
