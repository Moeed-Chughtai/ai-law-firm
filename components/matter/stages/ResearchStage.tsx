'use client';

import { Matter, StageInfo, Issue } from '@/lib/types';
import { Search, ChevronDown, Zap, Globe, AlertTriangle, Scale } from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

export default function ResearchStage({ matter, stage }: Props) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const issues = matter.issues || [];
  const data = stage.data;
  const isRunning = stage.status === 'running';

  const completedResearch = issues.filter((i) => i.research).length;
  const totalAgents = completedResearch * 3;

  const getActiveTab = (issueId: string) => activeTab[issueId] || 'marketNorms';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Swarm indicator */}
      <div className="glass-card-strong p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Agent Swarm Research</h3>
            <p className="text-xs text-gray-500">
              {isRunning
                ? 'Research agents analyzing issues in parallel...'
                : 'Research complete across all issues'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
            <Zap className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-indigo-700">3</div>
            <div className="text-[10px] text-indigo-500 font-medium">Parallel Agents</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
            <Globe className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-indigo-700">{totalAgents}</div>
            <div className="text-[10px] text-indigo-500 font-medium">Agent Runs</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
            <Scale className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-indigo-700">
              {completedResearch}/{issues.length}
            </div>
            <div className="text-[10px] text-indigo-500 font-medium">Issues Researched</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-surface-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{
              width: `${(completedResearch / Math.max(issues.length, 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Per-issue research cards */}
      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="glass-card-strong overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
              }
              className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    issue.research ? 'bg-emerald-500' : isRunning ? 'bg-brand-500 animate-pulse' : 'bg-surface-300'
                  }`}
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{issue.title}</h4>
                  <span
                    className={`severity-badge mt-1 ${
                      issue.severity === 'critical'
                        ? 'severity-critical'
                        : issue.severity === 'high'
                          ? 'severity-high'
                          : issue.severity === 'medium'
                            ? 'severity-medium'
                            : issue.severity === 'low'
                              ? 'severity-low'
                              : 'severity-info'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {issue.research && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    3 agents completed
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedIssue === issue.id ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {expandedIssue === issue.id && issue.research && (
              <div className="border-t border-surface-200 p-5">
                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-surface-100 rounded-lg p-1">
                  {[
                    { key: 'marketNorms', label: 'Market Norms', icon: Globe },
                    { key: 'riskImpact', label: 'Risk Impact', icon: AlertTriangle },
                    { key: 'negotiationLeverage', label: 'Negotiation Leverage', icon: Scale },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() =>
                        setActiveTab({ ...activeTab, [issue.id]: key })
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        getActiveTab(issue.id) === key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getActiveTab(issue.id) === 'marketNorms' &&
                      issue.research.marketNorms}
                    {getActiveTab(issue.id) === 'riskImpact' &&
                      issue.research.riskImpact}
                    {getActiveTab(issue.id) === 'negotiationLeverage' &&
                      issue.research.negotiationLeverage}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
