import { Matter, Issue, Severity } from '../../types';
import { generateId } from '../../utils';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';
import { retrieveIssueContext, formatChunksForPrompt } from '../../rag/retrieval';

interface IssueAnalysisResult {
  issues: Array<{
    title: string;
    severity: Severity;
    clauseRef: string;
    explanation: string;
  }>;
}

export async function runIssueAnalysis(matter: Matter): Promise<Partial<Matter>> {
  const systemPrompt = `You are a senior startup lawyer specializing in ${matter.docType === 'safe' ? 'SAFE agreements' : 'venture capital term sheets'}. Analyze the document for legal issues, market deviations, and potential risks. Use the provided legal references to ensure accuracy. Be thorough but focused on material issues.`;

  // Retrieve relevant legal context
  const legalContext = await retrieveIssueContext(
    'legal issues market standards',
    'general',
    matter
  );
  const contextText = legalContext.length > 0
    ? `\n\nReference Legal Documents:\n${formatChunksForPrompt(legalContext)}`
    : '';

  const userPrompt = `Analyze this ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'} document for legal issues:

Document:
${matter.documentText.substring(0, 4000)}${contextText}

Risk Tolerance: ${matter.riskTolerance}
${matter.riskTolerance === 'low' ? 'Flag everything, even minor issues.' : matter.riskTolerance === 'medium' ? 'Focus on significant issues that materially impact the deal.' : 'Only flag critical issues that could severely harm the founder.'}

Return JSON with an array of issues:
{
  "issues": [
    {
      "title": "Clear, specific issue title",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "clauseRef": "Section X — Clause Name",
      "explanation": "Detailed explanation of why this is an issue, what the risk is, and how it compares to market standards (2-3 sentences). Reference specific legal documents when relevant."
    }
  ]
}

Focus on:
- Valuation terms (caps, discounts, pricing)
- Investor rights and protections
- Founder protections and restrictions
- Conversion mechanics
- Governance and control
- Market standard deviations`;

  const result = await callLLMJSON<IssueAnalysisResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxTokens: 3000 }
  );

  const issues: Issue[] = result.issues.map((issue) => ({
    ...issue,
    id: generateId(),
  }));

  // Update incrementally for UI
  for (let i = 0; i < issues.length; i++) {
    const current = await getMatter(matter.id);
    if (current) {
      current.issues = issues.slice(0, i + 1);
      current.stages = current.stages.map((s) =>
        s.id === 'issue_analysis'
          ? { ...s, data: { issuesFound: i + 1, issues: current.issues } }
          : s
      ));
      await setMatter(current);
    }
    // Small delay to show incremental updates
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { issues };
}
