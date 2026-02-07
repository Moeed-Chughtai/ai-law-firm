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
    low: 0.90,
    medium: 0.80,
    high: 0.70,
  };

  const requiredThreshold = thresholds[matter.riskTolerance] || 0.80;
  const criticalCount = matter.issues.filter((i) => i.severity === 'critical').length;
  const highCount = matter.issues.filter((i) => i.severity === 'high').length;
  const issuesWithSynthesis = matter.issues.filter((i) => i.synthesis).length;
  const issuesWithRedlines = matter.issues.filter((i) => i.redline).length;

  const systemPrompt = `You are a legal compliance and quality assurance officer. You evaluate whether AI-generated legal analysis meets professional standards before delivery to clients. Your role is critical — you are the last line of defense before the client sees this work.

Evaluate rigorously but fairly. The goal is to ensure quality and flag genuine risks, not to block good work.`;

  const userPrompt = `Evaluate guardrails for this legal matter:

**Document Type:** ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
**Jurisdiction:** ${matter.jurisdiction}
**Risk Tolerance:** ${matter.riskTolerance}
**Overall Confidence:** ${Math.round(confidenceScore * 100)}%
**Required Threshold:** ${Math.round(requiredThreshold * 100)}%

**Analysis Quality Metrics:**
- Issues Found: ${matter.issues.length}
- Critical Issues: ${criticalCount}
- High Issues: ${highCount}
- Issues with Complete Synthesis: ${issuesWithSynthesis}/${matter.issues.length}
- Issues with Redlines: ${issuesWithRedlines}/${matter.issues.length}

**Adversarial Review:**
- Critiques: ${(matter.adversarialCritiques || []).length}
- Draft Revised: ${matter.draftRevised ? 'Yes' : 'No'}

**Recommendations Summary:**
${matter.issues
  .filter((i) => i.synthesis)
  .map((i) => `- ${i.title} (${i.severity}, ${Math.round((i.synthesis?.confidence || 0) * 100)}%): ${i.synthesis?.recommendation?.substring(0, 100)}`)
  .join('\n')}

**Guardrail Checks:**

1. **Jurisdiction Check**: Is this analysis appropriate for ${matter.jurisdiction} corporate law? Are there any jurisdiction-specific issues?

2. **Citation Completeness**: Do the recommendations appear backed by substantive legal reasoning? Are there any unsupported claims?

3. **Confidence Threshold**: Score ${Math.round(confidenceScore * 100)}% vs Required ${Math.round(requiredThreshold * 100)}%

**Escalation Rules (trigger ANY = escalate):**
- Confidence below required threshold
- Risk tolerance "low" AND any critical issues present
- Citation completeness is "fail"
- Adversarial review flagged material errors (draftRevised = true)
- Any issue has confidence below 0.6

Return JSON:
{
  "jurisdictionCheck": "pass" | "fail",
  "citationCompleteness": "pass" | "warning" | "fail",
  "confidenceThreshold": {
    "score": ${confidenceScore.toFixed(3)},
    "required": ${requiredThreshold},
    "pass": ${confidenceScore >= requiredThreshold}
  },
  "escalationRequired": boolean,
  "escalationReason": "Specific reason(s) for escalation, or null if not required"
}`;

  const guardrails = await callLLMJSON<GuardrailAnalysis>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 1000 }
  );

  // Override confidence threshold with deterministic check
  guardrails.confidenceThreshold = {
    score: confidenceScore,
    required: requiredThreshold,
    pass: confidenceScore >= requiredThreshold,
  };

  // Deterministic escalation overrides
  if (matter.riskTolerance === 'low' && criticalCount > 0) {
    guardrails.escalationRequired = true;
    guardrails.escalationReason = guardrails.escalationReason
      ? `${guardrails.escalationReason}; Low risk tolerance with ${criticalCount} critical issue(s)`
      : `Low risk tolerance with ${criticalCount} critical issue(s) — human review recommended`;
  }

  if (matter.draftRevised) {
    guardrails.escalationRequired = true;
    guardrails.escalationReason = guardrails.escalationReason
      ? `${guardrails.escalationReason}; Adversarial review flagged material concerns`
      : 'Adversarial review flagged material concerns requiring human oversight';
  }

  if (!guardrails.confidenceThreshold.pass) {
    guardrails.escalationRequired = true;
    guardrails.escalationReason = guardrails.escalationReason
      ? `${guardrails.escalationReason}; Confidence ${Math.round(confidenceScore * 100)}% below required ${Math.round(requiredThreshold * 100)}%`
      : `Confidence score ${Math.round(confidenceScore * 100)}% is below the required ${Math.round(requiredThreshold * 100)}% threshold`;
  }

  return {
    guardrails,
    stages: matter.stages.map((s) =>
      s.id === 'guardrails' ? { ...s, data: guardrails } : s
    ),
  };
}
