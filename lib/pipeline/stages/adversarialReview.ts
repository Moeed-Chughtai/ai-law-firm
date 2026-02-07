import { Matter } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface AdversarialResult {
  critiques: string[];
  draftRevised: boolean;
  revisionReason?: string;
}

export async function runAdversarialReview(
  matter: Matter
): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE' : 'Term Sheet';

  const systemPrompt = `You are a ruthless, independent legal quality assurance reviewer — the "red team" at a top law firm. Your job is to find flaws, gaps, and weaknesses in the initial analysis before it reaches the client. You are adversarial but constructive.

You challenge on five dimensions:
1. **Completeness**: Are there issues in the document that were MISSED entirely?
2. **Severity Accuracy**: Are any issues over- or under-rated in severity?
3. **Recommendation Quality**: Are the recommendations specific, practical, and likely to succeed in negotiation?
4. **Legal Accuracy**: Are there any legal errors or outdated references?
5. **Citation Gaps**: Are claims backed by evidence, or are they unsupported assertions?

You are known for catching the issues that slip through initial review. Be thorough and specific.`;

  const issuesSummary = matter.issues
    .map((i, idx) => {
      let details = `${idx + 1}. **${i.title}** (${i.severity})\n   Clause: ${i.clauseRef}\n   Explanation: ${i.explanation}`;
      if (i.synthesis) {
        details += `\n   Recommendation: ${i.synthesis.recommendation}\n   Confidence: ${Math.round(i.synthesis.confidence * 100)}%`;
      }
      if (i.redline) {
        details += `\n   Redline: ${i.redline.substring(0, 200)}`;
      }
      return details;
    })
    .join('\n\n');

  const userPrompt = `Conduct an adversarial review of this ${docName} analysis:

**Document Type:** ${docName}
**Risk Tolerance:** ${matter.riskTolerance}
**Issues Found:** ${matter.issues.length}
**Overall Confidence:** ${Math.round((matter.overallConfidence || 0) * 100)}%

**Original Document (for cross-reference):**
${matter.documentText.substring(0, 2000)}

**Complete Analysis to Review:**
${issuesSummary}

Provide your adversarial assessment:

Return JSON:
{
  "critiques": [
    "Specific, actionable critique or confirmation. Each item should either (a) identify a specific flaw with a suggested fix, or (b) confirm that a specific aspect passed review. Be concrete — reference specific issues by name."
  ],
  "draftRevised": true/false (true ONLY if you found material errors that would mislead the client),
  "revisionReason": "If draftRevised is true, explain what was materially wrong"
}

Provide 4-6 critique points. At least one should acknowledge something the analysis did well.`;

  const result = await callLLMJSON<AdversarialResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 2500 }
  );

  return {
    adversarialCritiques: result.critiques || [],
    draftRevised: result.draftRevised || false,
    stages: matter.stages.map((s) =>
      s.id === 'adversarial_review'
        ? {
            ...s,
            data: {
              critiquesCount: (result.critiques || []).length,
              critiques: result.critiques || [],
              loopbackOccurred: result.draftRevised,
              draftRevised: result.draftRevised,
              revisionReason: result.revisionReason,
            },
          }
        : s
    ),
  };
}
