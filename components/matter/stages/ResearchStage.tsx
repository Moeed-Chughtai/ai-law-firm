'use client';

import { Matter, StageInfo, Issue } from '@/lib/types';
import {
  Search,
  ChevronDown,
  Zap,
  Globe,
  AlertTriangle,
  Scale,
  Bot,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  matter: Matter;
  stage: StageInfo;
}

const TAB_INFO: Record<string, { icon: React.ElementType; label: string; desc: string }> = {
  marketNorms: {
    icon: Globe,
    label: 'Market Norms',
    desc: 'How this clause compares to standard market practice in comparable transactions',
  },
  riskImpact: {
    icon: AlertTriangle,
    label: 'Risk Impact',
    desc: 'Quantified risk exposure and potential consequences if this provision is accepted as-is',
  },
  negotiationLeverage: {
    icon: Scale,
    label: 'Negotiation Leverage',
    desc: 'Practical leverage points and counter-proposals for your negotiation strategy',
  },
};

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
    <div className="space-y-8 animate-slide-up">
      {/* Agent Swarm Dashboard */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Research Agents</h4>
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          {/* Agent architecture diagram */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Orchestrator</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-px bg-slate-300" />
              <div className="w-8 h-px bg-slate-300" />
              <div className="w-8 h-px bg-slate-300" />
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: Globe, label: 'Market Norms', color: 'bg-sky-100 text-sky-700' },
                { icon: AlertTriangle, label: 'Risk Impact', color: 'bg-amber-100 text-amber-700' },
                { icon: Scale, label: 'Negotiation', color: 'bg-violet-100 text-violet-700' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${color}`}>
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xl font-serif font-bold text-slate-900">3</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Parallel Agents</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xl font-serif font-bold text-slate-900">{totalAgents}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Total Runs</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xl font-serif font-bold text-slate-900">
                {completedResearch}/{issues.length}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Issues Covered</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-slate-800 rounded-full transition-all duration-500"
              style={{
                width: `${(completedResearch / Math.max(issues.length, 1)) * 100}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Each issue is researched by 3 specialized agents analyzing market norms, risk impact, and negotiation leverage simultaneously.
          </p>
        </div>
      </div>

      {/* Per-issue research cards */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Research by Issue</h4>
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() =>
                  setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                }
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      issue.research ? 'bg-emerald-500' : isRunning ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`severity-badge ${
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
                      <span className="text-[10px] font-mono text-slate-400">{issue.clauseRef}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {issue.research && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ 3 agents
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedIssue === issue.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedIssue === issue.id && issue.research && (
                <div className="border-t border-slate-200 p-5">
                  {/* Tabs */}
                  <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
                    {Object.entries(TAB_INFO).map(([key, { icon: Icon, label }]) => (
                      <button
                        key={key}
                        onClick={() =>
                          setActiveTab({ ...activeTab, [issue.id]: key })
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                          getActiveTab(issue.id) === key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab description */}
                  <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1.5">
                    <Bot className="w-3 h-3" />
                    {TAB_INFO[getActiveTab(issue.id)]?.desc}
                  </p>

                  {/* Tab content */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">
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

      {/* What happens next */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Next: Legal Judgment Synthesis</span> — Research findings will be synthesized into actionable recommendations with confidence scores and prioritized reasoning.
        </p>
      </div>
    </div>
  );
}
