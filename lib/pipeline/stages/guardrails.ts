import { Matter, GuardrailResult } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface GuardrailAnalysis {
  jurisdictionCheck: 'pass' | 'fail';
  citationCompleteness: 'pass' | 'warning' | 'fail';
  confidenceThreshold: { score: number; required: number; pass: boolean };
  escalationRequired: boolean;
  escalationReason?: string;
}

export async function runGuardrails(matter: Matter): Promise<Partial<Matter>> {
  const confidenceScore = matter.overallConfidence || 0;

  const thresholds: Record<string, number> = {
    low: 0.9,
    medium: 0.8,
    high: 0.7,
  };

  const requiredThreshold = thresholds[matter.riskTolerance] || 0.8;

  const systemPrompt = `You are a legal compliance officer. Evaluate whether this matter passes all guardrails and safety checks.`;

  const userPrompt = `Evaluate guardrails for this legal matter:

Document Type: ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
Jurisdiction: ${matter.jurisdiction}
Risk Tolerance: ${matter.riskTolerance}
Overall Confidence: ${Math.round(confidenceScore * 100)}%

Issues Found: ${matter.issues.length}
Critical Issues: ${matter.issues.filter((i) => i.severity === 'critical').length}
High Issues: ${matter.issues.filter((i) => i.severity === 'high').length}

Recommendations:
${matter.issues
  .filter((i) => i.synthesis)
  .map((i) => `- ${i.title}: ${i.synthesis?.recommendation}`)
  .join('\n')}

Check:
1. Jurisdiction: Is this Delaware corporate law compliant? (should be pass)
2. Citation Completeness: Are recommendations backed by legal sources? (pass/warning/fail)
3. Confidence Threshold: Score ${Math.round(confidenceScore * 100)}% vs Required ${Math.round(requiredThreshold * 100)}% (pass if score >= required)

Escalation Rules:
- Escalate if confidence < required threshold
- Escalate if risk tolerance is "low" AND there are critical issues
- Escalate if citation completeness is "fail"

Return JSON:
{
  "jurisdictionCheck": "pass" | "fail",
  "citationCompleteness": "pass" | "warning" | "fail",
  "confidenceThreshold": {
    "score": ${confidenceScore},
    "required": ${requiredThreshold},
    "pass": boolean
  },
  "escalationRequired": boolean,
  "escalationReason": "Why escalation is needed (if true)"
}`;

  const guardrails = await callLLMJSON<GuardrailAnalysis>(
    systemPrompt,
    userPrompt,
    { temperature: 0.2, maxTokens: 1000 }
  );

  return {
    guardrails,
    stages: matter.stages.map((s) =>
      s.id === 'guardrails' ? { ...s, data: guardrails } : s
    ),
  };
}
