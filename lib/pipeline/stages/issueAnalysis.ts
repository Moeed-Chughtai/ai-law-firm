import { Matter, Issue, Severity } from '../../types';
import { generateId } from '../../utils';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';
import { retrieveGeneralIssueContext, formatChunksForPrompt } from '../../rag/retrieval';

interface AnalyzedIssue {
  title: string;
  severity: Severity;
  clauseRef: string;
  explanation: string;
  confidence: number;
}

interface IssueAnalysisResult {
  issues: AnalyzedIssue[];
}

export async function runIssueAnalysis(matter: Matter): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Term Sheet';

  const systemPrompt = `You are a senior partner at a leading Silicon Valley law firm with 20+ years of experience in venture financing. You have reviewed over 5,000 ${docName}s and deeply understand market standards, founder protections, and investor dynamics.

Your analysis framework:
1. **Market Standard Deviation**: Compare every material term against current market benchmarks (YC SAFE standards, NVCA model documents, recent deal data)
2. **Economic Impact**: Assess how each term affects the founder's economics — dilution, control, exit scenarios
3. **Hidden Risks**: Identify subtle issues that non-lawyers typically miss — interaction effects between clauses, missing protections, ambiguous language
4. **Severity Calibration**: Be precise about severity. "Critical" = could lose the company or massive dilution. "High" = significant economic impact. "Medium" = meaningful but manageable. "Low" = minor deviation. "Info" = educational, no action needed.

${isSafe ? `SAFE-Specific Analysis Areas:
- Valuation cap vs. market (YC standard: $10-15M pre-seed, varies by stage)
- Discount rate (standard: 20%, flag >25% or <15%)
- MFN clause presence and completeness
- Pro-rata rights and minimum thresholds
- Conversion mechanics and Safe Preferred Stock terms
- Dissolution event handling
- Side letters or unusual amendments` : `Term Sheet-Specific Analysis Areas:
- Liquidation preference type (1x non-participating = standard; participating = aggressive)
- Anti-dilution mechanism (broad-based weighted average = standard; full ratchet = punitive)
- Board composition and control dynamics
- Protective provisions scope (standard vs. over-reaching)
- Drag-along/tag-along provisions
- Information rights and reporting requirements
- Employee option pool size and treatment
- Redemption rights, pay-to-play provisions`}`;

  // Retrieve relevant legal context (gracefully handle failures)
  let contextText = '';
  try {
    const legalContext = await retrieveGeneralIssueContext(matter);
    if (legalContext.length > 0) {
      contextText = `\n\n**Reference Legal Documents & Market Data:**\n${formatChunksForPrompt(legalContext)}`;
    }
  } catch (error) {
    console.warn('RAG retrieval failed, continuing with LLM knowledge:', error);
  }

  const riskGuidance: Record<string, string> = {
    low: 'Flag ALL deviations from market standard, including minor ones. Be exhaustive. Include informational notes about standard terms that could be improved. Aim for 8-15 issues.',
    medium: 'Flag issues that materially impact deal economics, control, or legal risk. Include both problems and noteworthy observations. Aim for 5-10 issues.',
    high: 'Focus only on critical and high-severity issues that could severely harm the founder. Skip minor deviations. Aim for 3-7 issues.',
  };

  const userPrompt = `Perform a comprehensive legal analysis of this ${docName}:

**FULL DOCUMENT TEXT:**
${matter.documentText}
${contextText}

**Risk Tolerance:** ${matter.riskTolerance.toUpperCase()}
**Analysis Guidance:** ${riskGuidance[matter.riskTolerance]}

Return a JSON object with your findings:
{
  "issues": [
    {
      "title": "Precise, specific issue title (e.g., 'Below-Market Valuation Cap at $8M' not just 'Valuation Cap Issue')",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "clauseRef": "Section X — [Clause Name] (exact reference from document)",
      "explanation": "Detailed explanation covering: (1) What the specific issue is, (2) How it deviates from market standard, (3) The concrete risk/impact on the founder, (4) Any relevant benchmarks or data points. Write 3-5 thorough sentences.",
      "confidence": 0.0-1.0 (how confident you are in this assessment)
    }
  ]
}

IMPORTANT: Analyze the COMPLETE document. Do not stop early. Every material section must be reviewed. Order issues by severity (critical first).`;

  let result: IssueAnalysisResult;
  try {
    result = await callLLMJSON<IssueAnalysisResult>(
      systemPrompt,
      userPrompt,
      { temperature: 0.2, maxTokens: 4096 }
    );
  } catch (error) {
    console.error('Issue analysis failed:', error);
    return { issues: [] };
  }

  const issues: Issue[] = (result.issues || []).map((issue) => ({
    ...issue,
    id: generateId(),
  }));

  // Update incrementally for real-time UI
  for (let i = 0; i < issues.length; i++) {
    const current = await getMatter(matter.id);
    if (current) {
      current.issues = issues.slice(0, i + 1);
      current.stages = current.stages.map((s) =>
        s.id === 'issue_analysis'
          ? { ...s, data: { issuesFound: i + 1, issues: current.issues } }
          : s
      );
      await setMatter(current);
    }
    if (i < issues.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return { issues };
}
