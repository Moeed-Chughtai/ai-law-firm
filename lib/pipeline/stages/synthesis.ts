import { Matter, Issue } from '../../types';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';

interface SynthesisResult {
  recommendation: string;
  confidence: number;
  reasoning: string;
}

async function synthesizeSingleIssue(
  issue: Issue,
  matter: Matter
): Promise<Issue> {
  if (!issue.research) return issue;

  const systemPrompt = `You are a senior managing partner at a top-tier law firm, known for delivering precise, actionable legal judgment. You synthesize research from multiple specialists into clear, decisive recommendations.

Your synthesis must:
1. Weigh all three research perspectives (market norms, risk impact, negotiation leverage)
2. Account for the client's risk tolerance and the specific deal context
3. Provide a single, clear recommendation with exact next steps
4. Assign a confidence score reflecting the strength of evidence and certainty of outcome
5. Explain WHY in terms the ${matter.audience === 'founder' ? 'founder can understand and act on immediately' : 'legal counsel can use to advise their client'}

Confidence calibration:
- 0.95+: Clear market standard violation with strong precedent
- 0.85-0.94: Strong evidence, minor ambiguity
- 0.75-0.84: Good evidence, some judgment required
- 0.65-0.74: Mixed signals, professional judgment call
- <0.65: Significant uncertainty, needs human review`;

  const userPrompt = `Synthesize all research into a final recommendation:

**Issue:** ${issue.title}
**Severity:** ${issue.severity}
**Clause:** ${issue.clauseRef}
**Explanation:** ${issue.explanation}

**Research — Market Norms:**
${issue.research.marketNorms}

**Research — Risk Impact:**
${issue.research.riskImpact}

**Research — Negotiation Leverage:**
${issue.research.negotiationLeverage}

**Client Risk Tolerance:** ${matter.riskTolerance}
**Audience:** ${matter.audience === 'founder' ? 'Founder (plain English, direct, actionable)' : 'Legal Counsel (technical, with citations and legal reasoning)'}

Return JSON:
{
  "recommendation": "${matter.audience === 'founder' ? 'Clear, direct recommendation in plain English. Start with what to DO (e.g., \"Push back on this term. Ask the investor to...\"). Include the specific ask and fallback position.' : 'Technical legal recommendation with specific proposed language changes, legal basis, and strategic rationale. Reference applicable standards.'}",
  "confidence": 0.XX (calibrated score reflecting evidence strength),
  "reasoning": "2-3 sentences explaining why this matters in practical terms and what happens if the client takes no action"
}`;

  const result = await callLLMJSON<SynthesisResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.2, maxTokens: 1200 }
  );

  return {
    ...issue,
    synthesis: result,
  };
}

export async function runSynthesis(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];
  let overallConfidence = 0;

  // Process synthesis in parallel batches of 4
  const BATCH_SIZE = 4;
  const synthesizedIssues: Issue[] = [];

  for (let batchStart = 0; batchStart < issues.length; batchStart += BATCH_SIZE) {
    const batch = issues.slice(batchStart, batchStart + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((issue) =>
        synthesizeSingleIssue(issue, matter).catch((error) => {
          console.error(`Synthesis failed for issue ${issue.id}:`, error);
          return issue;
        })
      )
    );

    synthesizedIssues.push(...batchResults);

    // Update incrementally
    const current = await getMatter(matter.id);
    if (current) {
      const allIssues = [...synthesizedIssues, ...issues.slice(synthesizedIssues.length)];
      current.issues = allIssues;

      const withSynthesis = allIssues.filter((iss) => iss.synthesis);
      overallConfidence = withSynthesis.length > 0
        ? withSynthesis.reduce((sum, iss) => sum + (iss.synthesis?.confidence || 0), 0) / withSynthesis.length
        : 0;

      current.overallConfidence = overallConfidence;
      current.stages = current.stages.map((s) =>
        s.id === 'synthesis'
          ? {
              ...s,
              data: {
                synthesized: withSynthesis.length,
                total: issues.length,
                overallConfidence,
                issues: allIssues,
              },
            }
          : s
      );
      await setMatter(current);
    }
  }

  return {
    issues: synthesizedIssues,
    overallConfidence,
  };
}
