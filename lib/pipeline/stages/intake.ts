import { Matter } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface IntakeData {
  detectedDocType: string;
  jurisdictionConfirmed: string;
  jurisdictionLocked: boolean;
  allowedScope: string[];
  matterAccepted: boolean;
  refusalReason: string | null;
  riskProfile: string;
  audienceMode: string;
  documentComplexity: 'simple' | 'moderate' | 'complex';
  estimatedIssues: number;
}

export async function runIntake(matter: Matter): Promise<Partial<Matter>> {
  const systemPrompt = `You are an elite legal intake specialist at a top-tier Silicon Valley law firm specializing in venture financing. You have reviewed thousands of SAFEs, convertible notes, and term sheets. Your role is to:
1. Verify the document type and jurisdiction
2. Assess document complexity and scope
3. Identify the appropriate analysis framework
4. Determine if the matter can be accepted for AI-assisted review

Be precise and thorough. This intake assessment shapes the entire downstream analysis.`;

  const docPreview = matter.documentText.substring(0, 3000);

  const userPrompt = `Perform intake analysis on this submitted document:

**Requested Document Type:** ${matter.docType === 'safe' ? 'SAFE (Simple Agreement for Future Equity)' : 'Venture Capital Term Sheet'}
**Client Risk Tolerance:** ${matter.riskTolerance} (${matter.riskTolerance === 'low' ? 'Conservative — flag all deviations from market standard' : matter.riskTolerance === 'medium' ? 'Balanced — flag material issues that impact deal economics or control' : 'Aggressive — flag only critical issues that could severely harm the client'})
**Target Audience:** ${matter.audience === 'founder' ? 'Startup Founder (non-lawyer, needs plain English)' : 'Legal Counsel (technical analysis with citations)'}

**Document Text:**
${docPreview}

Provide a comprehensive intake assessment as JSON:
{
  "detectedDocType": "Full formal name of the document type detected",
  "jurisdictionConfirmed": "Delaware" or detected jurisdiction,
  "jurisdictionLocked": true,
  "allowedScope": ["Array of 8-12 specific analysis areas, e.g.: 'Valuation cap analysis', 'Discount rate benchmarking', 'Conversion mechanics review', 'Liquidation preference analysis', 'Anti-dilution protection review', 'Pro-rata rights assessment', 'Board composition analysis', 'Protective provisions review', 'Information rights evaluation', 'Drag-along/Tag-along analysis'"],
  "matterAccepted": true/false (true if document is a valid financing document),
  "refusalReason": null or "Specific reason if rejected",
  "riskProfile": "${matter.riskTolerance} — [one sentence describing the analysis approach]",
  "audienceMode": "Detailed description of output formatting approach for this audience",
  "documentComplexity": "simple" | "moderate" | "complex",
  "estimatedIssues": estimated number of issues likely to be found
}`;

  const scopeDecisions = await callLLMJSON<IntakeData>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 1500 }
  );

  return {
    stages: matter.stages.map((s) =>
      s.id === 'intake' ? { ...s, data: scopeDecisions } : s
    ),
  };
}
