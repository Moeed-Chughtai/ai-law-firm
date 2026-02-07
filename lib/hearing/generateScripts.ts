import { Issue } from '../types';

const MAX_SCRIPT_CHARS = 280;

function summarizeForSpeech(text: string): string {
  if (!text || !text.trim()) return 'No specific data for this issue.';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= MAX_SCRIPT_CHARS) return cleaned;
  const sentenceEnd = cleaned.lastIndexOf('.', MAX_SCRIPT_CHARS);
  const cut = sentenceEnd > 0 ? cleaned.slice(0, sentenceEnd + 1) : cleaned.slice(0, MAX_SCRIPT_CHARS) + '.';
  return cut;
}

function getRecommendationLine(issue: Issue): string {
  const syn = issue.synthesis;
  if (!syn) return 'I recommend reviewing this with counsel.';
  const action = (syn.primaryAction || syn.recommendation || '').toLowerCase();
  if (action.includes('push back') || action.includes('negotiate') || action.includes('counter')) {
    return 'My recommendation: push back.';
  }
  if (action.includes('accept') && !action.includes('don\'t')) {
    return 'My recommendation: accept as is.';
  }
  return 'My recommendation: push back.';
}

export interface AgentSegment {
  agentRole: string;
  agentName: string;
  script: string;
}

export interface HearingScripts {
  issueTitle: string;
  issueSeverity: string;
  agentSegments: AgentSegment[];
  synthesisScript: string;
}

export function generateHearingScripts(issue: Issue): HearingScripts {
  const research = issue.research;
  const recommendation = getRecommendationLine(issue);
  const confidence = issue.synthesis
    ? Math.round(issue.synthesis.confidence * 100)
    : 0;

  const agentSegments: AgentSegment[] = [];

  if (research) {
    agentSegments.push({
      agentRole: 'Market Intelligence',
      agentName: 'Market Intelligence Agent',
      script: `I'm the Market Intelligence Agent. ${summarizeForSpeech(research.marketNorms)} ${recommendation}`,
    });
    agentSegments.push({
      agentRole: 'Financial Modeling',
      agentName: 'Financial Modeling Agent',
      script: `I'm the Financial Modeling Agent. ${summarizeForSpeech(research.riskImpact)} ${recommendation}`,
    });
    agentSegments.push({
      agentRole: 'Negotiation Strategy',
      agentName: 'Negotiation Strategist Agent',
      script: `I'm the Negotiation Strategist Agent. ${summarizeForSpeech(research.negotiationLeverage)} ${recommendation}`,
    });
    agentSegments.push({
      agentRole: 'Legal Precedent',
      agentName: 'Legal Precedent Agent',
      script: `I'm the Legal Precedent Agent. ${summarizeForSpeech(research.precedents || 'No direct precedent on this point.')} ${recommendation}`,
    });
  }

  const primaryAction = issue.synthesis?.primaryAction || issue.synthesis?.recommendation || 'Review with counsel.';
  const synthesisScript =
    agentSegments.length >= 2
      ? `Consensus reached. All four agents recommend the same position. Confidence: ${confidence} percent. Here is the primary action: ${summarizeForSpeech(primaryAction)}`
      : `Synthesis complete. Confidence: ${confidence} percent. Here is the recommendation: ${summarizeForSpeech(primaryAction)}`;

  return {
    issueTitle: issue.title,
    issueSeverity: issue.severity,
    agentSegments,
    synthesisScript,
  };
}
