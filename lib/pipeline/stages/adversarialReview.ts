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
  const systemPrompt = `You are an adversarial legal reviewer. Your job is to challenge the initial analysis, find gaps, question assumptions, and ensure rigor. Be critical but constructive.`;

  const userPrompt = `Review this legal analysis adversarially:

Document Type: ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
Issues Found: ${matter.issues.length}
Risk Tolerance: ${matter.riskTolerance}

Issues and Recommendations:
${matter.issues
  .map(
    (i, idx) =>
      `${idx + 1}. ${i.title} (${i.severity}): ${i.synthesis?.recommendation || i.explanation}`
  )
  .join('\n')}

Redlines Generated:
${matter.issues
  .filter((i) => i.redline)
  .map((i) => `${i.title}: ${i.redline}`)
  .join('\n\n')}

Challenge this analysis:
1. Are there missing issues?
2. Are severity ratings appropriate?
3. Are recommendations sound?
4. Are redlines legally correct?
5. Are there citation gaps?

Return JSON:
{
  "critiques": ["List of specific critiques or confirmations (3-5 items)"],
  "draftRevised": boolean (true if you found issues requiring revision),
  "revisionReason": "Why revision was needed (if draftRevised is true)"
}`;

  const result = await callLLMJSON<AdversarialResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 2000 }
  );

  return {
    adversarialCritiques: result.critiques,
    draftRevised: result.draftRevised,
    stages: matter.stages.map((s) =>
      s.id === 'adversarial_review'
        ? {
            ...s,
            data: {
              critiquesCount: result.critiques.length,
              critiques: result.critiques,
              loopbackOccurred: result.draftRevised,
              draftRevised: result.draftRevised,
            },
          }
        : s
    ),
  };
}
