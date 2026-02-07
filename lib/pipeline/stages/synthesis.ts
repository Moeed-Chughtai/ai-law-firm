import { Matter, Issue } from '../../types';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';

interface SynthesisResult {
  recommendation: string;
  confidence: number;
  reasoning: string;
  primaryAction: string;
  fallbackPosition: string;
  walkAwayThreshold: string;
  priorityRank: number;
}

async function synthesizeSingleIssue(
  issue: Issue,
  matter: Matter
): Promise<Issue> {
  if (!issue.research) return issue;

  const audienceIsFounder = matter.audience === 'founder';
  const isSafe = matter.docType === 'safe';

  const systemPrompt = `You are the partner-in-charge at a top-3 Silicon Valley venture law firm (Fenwick & West / Cooley / Wilson Sonsini caliber), personally responsible for signing off on every piece of advice that leaves the firm. You have 25+ years of experience closing venture financings and have personally advised on over 3,000 deals.

**Your Synthesis Framework — The "Partner Decision Protocol":**

1. **Evidence Triangulation**
   Weigh all four research inputs (market norms, risk impact, negotiation leverage, legal precedent) and identify:
   - Where they AGREE: high-confidence signal → decisive recommendation
   - Where they DISAGREE: flag the tension, explain which perspective you weight more heavily and WHY
   - What's MISSING: identify any information gaps that affect your confidence
   - Whether the legal authority supports or undermines the negotiation position

2. **Decision Architecture**
   Structure your recommendation using this hierarchy:
   a) **Primary Recommendation**: The single most important thing the client should do
   b) **Fallback Position**: If the primary ask is rejected, what's the acceptable compromise?
   c) **Walk-Away Threshold**: At what point should the client refuse to proceed?
   d) **Accept Criteria**: Under what conditions is the current term actually acceptable?

3. **Confidence Calibration (Bayesian approach)**
   Start with a base rate from market data, then adjust:
   - +0.10 if all three research perspectives align
   - +0.05 if strong RAG/citation support exists
   - -0.05 if research perspectives conflict on materiality
   - -0.10 if this is a novel/unusual structure with limited precedent
   - -0.15 if the economic impact is highly scenario-dependent
   
   Final calibration:
   - 0.92-1.0: Near-certain — black-letter law or mathematical fact
   - 0.82-0.91: High confidence — strong evidence, minor judgment
   - 0.72-0.81: Moderate — solid basis but reasonable minds could differ
   - 0.62-0.71: Low-moderate — significant judgment involved, important caveats
   - <0.62: Low — high uncertainty, recommend human attorney review

4. **Audience Calibration**
   ${audienceIsFounder ? `FOUNDER MODE: 
   - Lead with the action verb: "Push back on...", "Accept...", "Counter-propose..."
   - Quantify everything: "$X impact", "Y% dilution"
   - Include the emotional reality: "This might feel confrontational, but it's standard practice"
   - Provide word-for-word scripts for investor conversations
   - Never use unexplained legal jargon` : `COUNSEL MODE:
   - Lead with the legal standard and how this deviates
   - Reference specific NVCA/YC model language, Del. Code sections, or case law
   - Provide exact proposed markup language
   - Include strategic sequencing advice (when to raise this in negotiation)
   - Note any malpractice risk if this issue is not flagged`}

5. **Risk-Tolerance Integration**
   ${matter.riskTolerance === 'low' ? 'Conservative client: recommend the most protective position available. Flag even minor deviations. The client would rather lose the deal than accept unfavorable terms.' : matter.riskTolerance === 'high' ? 'Aggressive/speed-focused client: recommend changes ONLY for issues with material economic impact (>2% dilution or control implications). The client values speed-to-close over maximum protection.' : 'Balanced client: recommend changes for material issues while acknowledging reasonable trade-offs. Identify which issues are "worth the fight" and which are acceptable concessions.'}`;

  const userPrompt = `**PARTNER SYNTHESIS REQUIRED — ${issue.severity.toUpperCase()} SEVERITY**

Synthesize all research into a single, authoritative recommendation that the client can act on today.

**Issue:** ${issue.title}
**Severity:** ${issue.severity}
**Category:** ${issue.category || 'Not categorized'}
**Clause Reference:** ${issue.clauseRef}
**Initial Analysis:** ${issue.explanation}
**Standard Form Deviation:** ${issue.standardFormDeviation || 'Not specified'}
**Cross-Clause Interactions:** ${issue.interactionEffects?.join('; ') || 'None identified'}

**RESEARCH INPUTS:**

📊 **Market Intelligence (Specialist 1):**
${issue.research.marketNorms}

💰 **Financial Impact Analysis (Specialist 2):**
${issue.research.riskImpact}

🤝 **Negotiation Strategy (Specialist 3):**
${issue.research.negotiationLeverage}

⚖️ **Legal Authority & Precedent (Specialist 4):**
${issue.research.precedents || 'No legal precedent research available'}

**DEAL CONTEXT:**
- Document Type: ${isSafe ? 'SAFE' : 'Term Sheet'}
- Risk Tolerance: ${matter.riskTolerance.toUpperCase()}
- Total Issues Found: ${matter.issues.length}
- This Issue's Position: ${matter.issues.findIndex(i => i.id === issue.id) + 1} of ${matter.issues.length}

Return JSON:
{
  "recommendation": "${audienceIsFounder ? 'Complete recommendation in 4-6 sentences. Structure: (1) Clear action verb opening — what to DO, (2) The specific ask with exact numbers or language, (3) The fallback position if the primary ask is rejected, (4) Why this matters in practical/dollar terms, (5) How to bring this up with the investor (tone, timing, framing). Must be plain English.' : 'Complete recommendation in 4-6 sentences. Structure: (1) Legal standard and how this deviates, (2) Proposed markup language with exact clause modifications, (3) Legal basis (NVCA model, Del. Code, case law), (4) Strategic sequencing recommendation, (5) Fallback position and minimum acceptable terms.'}",
  "primaryAction": "Single sentence: the ONE most important thing the client should do about this issue. Start with an action verb. E.g., 'Push back on the $8M valuation cap and counter-propose $12M based on current pre-seed market median.' or 'Accept this clause as-is — it meets market standard.'",
  "fallbackPosition": "If the primary ask is rejected, what is the acceptable compromise? Be specific. E.g., 'Accept $10M cap if investor agrees to remove the 25% discount.' or 'Agree to full ratchet only if it includes a pay-to-play provision.'",
  "walkAwayThreshold": "At what point should the client refuse to proceed on this specific issue? E.g., 'Any cap below $8M combined with a discount above 20% creates unacceptable dilution.' or 'Full ratchet without any sunset or threshold is a deal-breaker at any valuation.'",
  "priorityRank": 1-5 (1 = negotiate first/most important, 5 = raise last/least important. Consider: severity, economic impact, likelihood of success, strategic positioning),
  "confidence": 0.XX,
  "reasoning": "3-4 sentences explaining: (1) The key evidence from all four specialists that drives your recommendation, (2) What happens if the client takes NO action — the specific downside scenario with numbers, (3) Any important caveats or conditions, (4) How this recommendation interacts with other issues in the document"
}`;

  const result = await callLLMJSON<SynthesisResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.2, maxTokens: 2000 }
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
