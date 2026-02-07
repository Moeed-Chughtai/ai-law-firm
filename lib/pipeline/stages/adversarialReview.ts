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
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';

  const systemPrompt = `You are the Chief Quality Officer and senior litigation partner at a top-10 Am Law firm. You were recruited specifically because you are the most demanding, detail-oriented legal mind in the industry. You have been retained as an independent "red team" reviewer — your sole job is to find every flaw, gap, and weakness in this analysis before it reaches the client.

**Your adversarial review mandate has THREE levels of increasing severity:**

**LEVEL 1 — Completeness Audit (did they miss anything?)**
- Cross-reference the ORIGINAL document against the issues list — is every material clause covered?
- Check for MISSING issues: provisions that should have been flagged but weren't
- Check for PHANTOM issues: assertions about the document that don't match its actual text
- Verify that ${isSafe ? 'all standard SAFE sections were analyzed (definitions, conversion mechanics, dissolution, MFN, pro-rata, information rights)' : 'all standard term sheet sections were analyzed (economics, control, protective provisions, governance, information rights, exit mechanisms)'}
- Verify cross-clause interactions were considered (does the anti-dilution provision interact with the option pool? Does the liquidation preference interact with the participation rights?)

**LEVEL 2 — Accuracy & Calibration Audit (is their analysis correct?)**
- Severity accuracy: Is each issue rated at the correct severity? Would a panel of 10 experienced venture lawyers agree with this rating, or would the majority rate it differently?
- Confidence accuracy: Are confidence scores properly calibrated? A score of 0.9 should mean "9 out of 10 experienced lawyers would reach the same conclusion"
- Market data accuracy: Are the market benchmarks and percentile claims plausible? Flag any data points that seem outdated, fabricated, or cherry-picked
- Economic modeling accuracy: Are the dilution calculations and scenario analyses mathematically sound?
- Recommendation accuracy: Would a reasonable lawyer be comfortable putting their bar number behind each recommendation?

**LEVEL 3 — Client-Readiness Audit (is this safe to deliver?)**
- Are there any recommendations that could constitute malpractice if a real lawyer delivered them?
- Are there any factual assertions that could embarrass the firm if challenged by opposing counsel?
- Is the analysis appropriately hedged where uncertainty exists?
- Are there any recommendations that ignore practical deal dynamics (e.g., suggesting terms no investor would accept)?
- Is the overall tone appropriate for the ${matter.audience === 'founder' ? 'founder audience (clear, supportive, actionable)' : 'legal counsel audience (precise, technical, defensible)'}?

**Your output should be:**
- SPECIFIC: Reference issues by name, cite specific claims, point to exact deficiencies
- CONSTRUCTIVE: Every critique must include a suggested fix or clarification
- BALANCED: Acknowledge what the analysis did WELL (at least 1-2 points)
- DECISIVE: Clearly state whether this analysis is safe to deliver to the client as-is

**The "draftRevised" flag should be TRUE only if you find a MATERIAL error that would:**
- Mislead the client into making a harmful decision
- Contain a factual error about what the document actually says
- Miss a critical or high-severity issue that a competent attorney would catch
- Provide a recommendation that constitutes genuinely bad legal advice

Minor calibration disagreements (e.g., "I'd rate this medium, not low") do NOT warrant revision — note them but don't flag draftRevised.`;

  const issuesSummary = matter.issues
    .map((i, idx) => {
      let details = `### Issue ${idx + 1}: ${i.title}
**Severity:** ${i.severity} | **Confidence:** ${i.confidence} | **Clause:** ${i.clauseRef}
**Analysis:** ${i.explanation}`;
      if (i.research) {
        details += `\n**Research — Market Norms:** ${i.research.marketNorms.substring(0, 300)}`;
        details += `\n**Research — Risk Impact:** ${i.research.riskImpact.substring(0, 300)}`;
        details += `\n**Research — Negotiation:** ${i.research.negotiationLeverage.substring(0, 300)}`;
      }
      if (i.synthesis) {
        details += `\n**Recommendation:** ${i.synthesis.recommendation}`;
        details += `\n**Synthesis Confidence:** ${Math.round(i.synthesis.confidence * 100)}%`;
        details += `\n**Reasoning:** ${i.synthesis.reasoning}`;
      }
      if (i.redline) {
        details += `\n**Redline Preview:** ${i.redline.substring(0, 400)}`;
      }
      return details;
    })
    .join('\n\n---\n\n');

  const userPrompt = `**ADVERSARIAL RED TEAM REVIEW — FULL ANALYSIS PACKAGE**

Conduct a rigorous three-level adversarial review of this complete ${docName} analysis before client delivery.

**DOCUMENT METADATA:**
- Document Type: ${docName}
- Risk Tolerance: ${matter.riskTolerance}
- Audience: ${matter.audience}
- Issues Found: ${matter.issues.length}
- Overall Confidence: ${Math.round((matter.overallConfidence || 0) * 100)}%

**ORIGINAL DOCUMENT (cross-reference against issues list):**
${matter.documentText.substring(0, 3000)}

**COMPLETE ANALYSIS TO REVIEW (${matter.issues.length} issues):**

${issuesSummary}

**SEVERITY DISTRIBUTION:**
- Critical: ${matter.issues.filter(i => i.severity === 'critical').length}
- High: ${matter.issues.filter(i => i.severity === 'high').length}
- Medium: ${matter.issues.filter(i => i.severity === 'medium').length}
- Low: ${matter.issues.filter(i => i.severity === 'low').length}
- Info: ${matter.issues.filter(i => i.severity === 'info').length}

Return JSON:
{
  "critiques": [
    "Each critique should be 2-4 sentences. Format: '[LEVEL X — Category] Specific finding. Evidence/reasoning. Suggested fix or acknowledgment.' Include 5-8 critique points covering all three levels. At least one should acknowledge something done well."
  ],
  "draftRevised": true/false (TRUE only for material errors that could harm the client — see criteria above),
  "revisionReason": "If draftRevised is true: specific description of the material error(s) found and what needs to change. If false: null"
}`;

  const result = await callLLMJSON<AdversarialResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 3500 }
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
