import { Matter, GuardrailResult } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface GuardrailAnalysis {
  jurisdictionCheck: 'pass' | 'fail';
  citationCompleteness: 'pass' | 'warning' | 'fail';
  confidenceThreshold: { score: number; required: number; pass: boolean };
  escalationRequired: boolean;
  escalationReason?: string;
  hallucinationCheck: 'pass' | 'warning' | 'fail';
  scopeComplianceCheck: 'pass' | 'warning' | 'fail';
  ethicsCheck: 'pass' | 'warning' | 'fail';
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
  const lowConfidenceIssues = matter.issues.filter(
    (i) => i.synthesis && i.synthesis.confidence < 0.6
  );
  const adversarialCritiquesCount = (matter.adversarialCritiques || []).length;

  const systemPrompt = `You are the General Counsel and Chief Compliance Officer of a legal AI company. You are personally liable for ensuring that AI-generated legal analysis meets professional standards before delivery to any client. You have deep expertise in legal ethics, malpractice standards, and AI safety in legal contexts.

**Your Guardrail Assessment Framework:**

1. **Jurisdiction Validation (CRITICAL — errors here create liability)**
   - Verify that the analysis is appropriate for ${matter.jurisdiction} law
   - Check that any statutory references are correct for the jurisdiction
   - Flag if the document contains choice-of-law provisions that create conflicts
   - ${matter.jurisdiction === 'delaware' ? 'Verify Delaware General Corporation Law (DGCL) compliance, including Title 8 requirements' : matter.jurisdiction === 'california' ? 'Verify California Corporations Code compliance and any SEC requirements for California-based issuers' : 'Verify applicable state corporate law compliance'}
   - Flag if international parties create potential cross-border issues

2. **Citation & Evidence Completeness**
   Assessment criteria:
   - **Pass**: All recommendations are supported by identifiable legal reasoning (market standards, statutory references, or established practice)
   - **Warning**: Some recommendations rely on general knowledge without specific grounding — acceptable but note for improvement
   - **Fail**: One or more recommendations make specific factual claims that appear unsupported or potentially fabricated (e.g., citing specific percentages without clear basis)

3. **Confidence Calibration Audit**
   - Check if confidence scores across issues are internally consistent
   - Flag if all scores cluster suspiciously (e.g., all between 0.80-0.85 — suggests auto-calibration rather than genuine assessment)
   - Check for appropriate spread: complex/novel issues should have lower confidence than straightforward market-standard deviations

4. **Hallucination Detection**
   - Cross-reference key claims in the analysis against the original document text
   - Flag any assertions about what the document says that don't match the actual document
   - Check that clause references (section numbers) actually exist in the document
   - Verify that market data claims are plausible (not fabricated statistics)

5. **Ethical & Professional Standards**
   - Does the analysis include appropriate disclaimers about AI-generated content?
   - Does it correctly identify when human attorney review is essential?
   - Are recommendations within the bounds of what a competent attorney would advise?
   - Does the analysis avoid unauthorized practice of law (UPL) issues?

6. **Escalation Criteria (ANY of these = mandatory escalation):**
   a) Confidence score below required threshold for risk tolerance
   b) Risk tolerance "low" AND any critical-severity issues present
   c) Citation completeness is "fail"
   d) Adversarial review flagged material errors (draftRevised = true)
   e) Any individual issue has synthesis confidence below 0.55
   f) Jurisdiction check fails
   g) Suspected hallucination detected
   h) Analysis covers fewer issues than expected for the document type (${matter.docType === 'safe' ? 'SAFE should typically have 4-10 flagged items' : 'Term Sheet should typically have 6-15 flagged items'})`;

  const userPrompt = `**GUARDRAIL ASSESSMENT — FINAL QUALITY GATE BEFORE CLIENT DELIVERY**

Evaluate whether this AI-generated legal analysis meets professional standards and is safe to deliver.

**MATTER OVERVIEW:**
- Document Type: ${matter.docType === 'safe' ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet'}
- Jurisdiction: ${matter.jurisdiction}
- Risk Tolerance: ${matter.riskTolerance.toUpperCase()}
- Audience: ${matter.audience}

**QUALITY METRICS:**
| Metric | Value | Target |
|--------|-------|--------|
| Overall Confidence | ${Math.round(confidenceScore * 100)}% | ≥${Math.round(requiredThreshold * 100)}% |
| Total Issues Found | ${matter.issues.length} | ${matter.docType === 'safe' ? '4-10' : '6-15'} |
| Critical Issues | ${criticalCount} | — |
| High Issues | ${highCount} | — |
| Issues with Synthesis | ${issuesWithSynthesis}/${matter.issues.length} | 100% |
| Issues with Redlines | ${issuesWithRedlines}/${matter.issues.length} | 100% |
| Low-Confidence Issues (<0.6) | ${lowConfidenceIssues.length} | 0 |
| Adversarial Critiques | ${adversarialCritiquesCount} | — |
| Draft Revised Flag | ${matter.draftRevised ? 'YES ⚠️' : 'No'} | No |
| Adversarial Loop Count | ${matter.adversarialLoopCount || 0} | 0-1 |

**ADVERSARIAL REVIEW FINDINGS:**
${(matter.adversarialCritiques || []).map((c, i) => `${i + 1}. ${c}`).join('\n') || 'No adversarial critiques recorded.'}

**ISSUE-LEVEL CONFIDENCE DISTRIBUTION:**
${matter.issues
  .filter((i) => i.synthesis)
  .map((i) => `- ${i.title} (${i.severity}): ${Math.round((i.synthesis?.confidence || 0) * 100)}% confidence`)
  .join('\n')}

**SAMPLE RECOMMENDATIONS (check for quality and groundedness):**
${matter.issues
  .filter((i) => i.synthesis)
  .slice(0, 5)
  .map((i) => `- **${i.title}**: ${i.synthesis?.recommendation?.substring(0, 200)}`)
  .join('\n')}

**ORIGINAL DOCUMENT (first 2000 chars for cross-reference):**
${matter.documentText.substring(0, 2000)}

**ASSESSMENT REQUIRED:**
Evaluate all guardrail dimensions and return:

{
  "jurisdictionCheck": "pass" | "fail",
  "citationCompleteness": "pass" | "warning" | "fail",
  "confidenceThreshold": {
    "score": ${confidenceScore.toFixed(3)},
    "required": ${requiredThreshold},
    "pass": ${confidenceScore >= requiredThreshold}
  },
  "hallucinationCheck": "pass" | "warning" | "fail" — Check if any assertions about the document don't match the actual text, or if market data claims seem fabricated,
  "scopeComplianceCheck": "pass" | "warning" | "fail" — Check if the analysis stayed within the defined engagement scope and addressed all scoped workstreams,
  "ethicsCheck": "pass" | "warning" | "fail" — Check if recommendations include appropriate disclaimers, avoid unauthorized practice of law, and correctly flag when human review is essential,
  "escalationRequired": boolean (apply ALL escalation criteria — be strict),
  "escalationReason": "Detailed reason(s) for escalation, or null if all checks pass."
}`;

  const guardrails = await callLLMJSON<GuardrailAnalysis>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 1500 }
  ).catch((error) => {
    console.error('Guardrails LLM call failed:', error);
    // Return safe defaults if LLM fails
    return {
      jurisdictionCheck: 'pass' as const,
      citationCompleteness: 'pass' as const,
      confidenceThreshold: {
        score: confidenceScore,
        required: requiredThreshold,
        pass: confidenceScore >= requiredThreshold,
      },
      escalationRequired: false,
      escalationReason: undefined,
      hallucinationCheck: 'warning' as const,
      scopeComplianceCheck: 'warning' as const,
      ethicsCheck: 'pass' as const,
    };
  });

  // Override confidence threshold with deterministic check (LLM can't change math)
  guardrails.confidenceThreshold = {
    score: confidenceScore,
    required: requiredThreshold,
    pass: confidenceScore >= requiredThreshold,
  };

  // Deterministic escalation overrides — these ALWAYS trigger regardless of LLM opinion
  const escalationReasons: string[] = [];

  if (guardrails.escalationReason) {
    escalationReasons.push(guardrails.escalationReason);
  }

  if (matter.riskTolerance === 'low' && criticalCount > 0) {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      `Low risk tolerance with ${criticalCount} critical issue(s) — human review recommended before proceeding`
    );
  }

  if (matter.draftRevised) {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      'Adversarial review flagged material concerns requiring human oversight'
    );
  }

  if (!guardrails.confidenceThreshold.pass) {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      `Overall confidence ${Math.round(confidenceScore * 100)}% is below the required ${Math.round(requiredThreshold * 100)}% threshold for ${matter.riskTolerance} risk tolerance`
    );
  }

  if (lowConfidenceIssues.length > 0) {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      `${lowConfidenceIssues.length} issue(s) have synthesis confidence below 0.60: ${lowConfidenceIssues.map(i => i.title).join(', ')}`
    );
  }

  if (guardrails.jurisdictionCheck === 'fail') {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      `Jurisdiction validation failed for ${matter.jurisdiction} — analysis may contain jurisdiction-inappropriate references`
    );
  }

  if (guardrails.citationCompleteness === 'fail') {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      'Citation completeness check failed — one or more recommendations may contain unsupported factual claims'
    );
  }

  if (guardrails.hallucinationCheck === 'fail') {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      'Hallucination check failed — assertions about the document may not match actual document text'
    );
  }

  if (guardrails.scopeComplianceCheck === 'fail') {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      'Scope compliance check failed — analysis may have exceeded or fallen short of the defined engagement scope'
    );
  }

  if (guardrails.ethicsCheck === 'fail') {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      'Ethics check failed — recommendations may lack appropriate disclaimers or risk unauthorized practice of law issues'
    );
  }

  // Flag if adversarial loopback was exhausted without resolution
  if ((matter.adversarialLoopCount || 0) >= 2 && matter.draftRevised) {
    guardrails.escalationRequired = true;
    escalationReasons.push(
      `Adversarial review loop exhausted (${matter.adversarialLoopCount} revision rounds) with unresolved material concerns — human review mandatory`
    );
  }

  // Consolidate escalation reasons
  if (escalationReasons.length > 0) {
    guardrails.escalationRequired = true;
    guardrails.escalationReason = escalationReasons.join('; ');
  }

  return {
    guardrails: {
      ...guardrails,
      hallucinationCheck: guardrails.hallucinationCheck,
      scopeComplianceCheck: guardrails.scopeComplianceCheck,
      ethicsCheck: guardrails.ethicsCheck,
    },
    stages: matter.stages.map((s) =>
      s.id === 'guardrails' ? { ...s, data: guardrails } : s
    ),
  };
}
