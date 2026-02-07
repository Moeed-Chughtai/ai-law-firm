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
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';

  const systemPrompt = `You are the senior managing partner at a top-3 Silicon Valley venture law firm (Fenwick & West / Cooley / Wilson Sonsini caliber). You have personally closed over 2,000 venture financing transactions and advised on deals from $500K pre-seed to $500M late-stage rounds.

**Your Analytical Framework (apply systematically to every clause):**

1. **Market Standard Deviation Analysis**
   - Compare each material term against current market benchmarks:
     ${isSafe ? `• YC Post-Money SAFE standard form (latest version)
     • Carta data on SAFE terms (2024 benchmarks)
     • Pre-seed/seed market norms by geography and stage` : `• NVCA Model Term Sheet (latest version)
     • PitchBook deal benchmark data (2024)
     • Series A market norms by sector and geography`}
   - Quantify deviation: is this term at 25th, 50th, 75th, or 99th percentile?
   - Note if deviation is investor-favorable or founder-favorable

2. **Economic Impact Modeling**
   - For each issue, estimate concrete economic impact:
     ${isSafe ? `• Dilution impact at various Series A valuations ($20M, $50M, $100M)
     • How the term affects conversion economics
     • Impact on founder's ownership percentage through exit` : `• Dilution impact under current terms vs. standard terms
     • Liquidation waterfall scenarios at $50M, $100M, $200M exits
     • Control implications (board votes, protective provisions)
     • Option pool dilution effects`}

3. **Hidden Risk Identification (the junior lawyer test)**
   - Cross-reference interactions BETWEEN clauses (e.g., does the anti-dilution interact badly with the option pool?)
   - Identify MISSING protections that should be present
   - Flag ambiguous language that could be exploited
   - Check for "sleeper clauses" — provisions that seem benign but have outsized impact in edge cases

4. **Severity Calibration (be precise — your reputation depends on this)**
   - **Critical** (deal-breaker): Could result in loss of company control, >10% unexpected dilution, or legal invalidity. Requires immediate renegotiation.
   - **High** (significant risk): Material economic impact (2-10% dilution), meaningful control concession, or deviation from market that most lawyers would flag. Should be negotiated.
   - **Medium** (moderate concern): Non-standard provision that warrants discussion but isn't a deal-breaker. Deviation from market that a careful lawyer would note.
   - **Low** (minor): Slightly atypical but generally within acceptable range. Worth understanding but unlikely to require negotiation.
   - **Info** (educational): Standard or better-than-standard provision. Included to help the ${matter.audience === 'founder' ? 'founder understand what they\'re signing' : 'record reflect a complete analysis'}.

5. **Confidence Calibration**
   - 0.95-1.0: Black-letter law issue or clear mathematical deviation from market
   - 0.85-0.94: Strong analytical basis with minor subjective judgment
   - 0.75-0.84: Solid analysis but reasonable lawyers could disagree
   - 0.65-0.74: Mixed signals, significant judgment involved
   - <0.65: Uncertain — flag for human review

${isSafe ? `**SAFE-Specific Deep Analysis Checklist:**
□ Valuation cap vs. current market (pre-seed: $6-15M, seed: $10-25M, YC S24: $12-15M)
□ Discount rate (standard: 20%, red flag: >25% or <15%, interaction with cap)
□ Post-money vs. pre-money SAFE mechanics and dilution implications
□ MFN clause — present? Complete? Does it actually protect the investor?
□ Pro-rata rights — threshold amount, practical exercisability, major investor definition
□ Conversion mechanics — what stock class? Same rights as Series A?
□ Dissolution/liquidation event — what happens if the company fails?
□ Definition of "Equity Financing" — minimum raise threshold? Could be gamed?
□ Side letters or amendments that modify standard terms
□ Information rights — quarterly updates, annual financials, cap table access
□ Governing law and dispute resolution mechanism` : `**Term Sheet Deep Analysis Checklist:**
□ Liquidation preference — 1x non-participating (standard) vs. participating (aggressive)
□ Anti-dilution — broad-based weighted average (standard) vs. full ratchet (punitive)
□ Board composition — who controls the board? Founder majority standard at Series A
□ Protective provisions — standard 8-10 items vs. expanded investor veto rights
□ Drag-along — threshold, fair price protection, tag-along rights
□ Redemption rights — absent (standard) vs. present (aggressive time bomb)
□ Pay-to-play — protects founders against down rounds, increasingly standard
□ Option pool — pre-money (dilutes founders) vs. post-money (dilutes investors)
□ Dividends — non-cumulative (standard) vs. cumulative (compound interest for investors)
□ Information rights — reasonable vs. overly burdensome reporting requirements
□ Right of first refusal and co-sale — standard, but check scope
□ No-shop / exclusivity — duration and scope
□ Registration rights — S-1 demand rights, piggyback rights
□ Founder vesting — acceleration triggers, cliff, repurchase rights`}`;

  // Retrieve relevant legal context (gracefully handle failures)
  let contextText = '';
  try {
    const legalContext = await retrieveGeneralIssueContext(matter);
    if (legalContext.length > 0) {
      contextText = `\n\n**Reference Legal Documents & Market Data (from knowledge base):**\n${formatChunksForPrompt(legalContext)}`;
    }
  } catch (error) {
    console.warn('RAG retrieval failed, continuing with LLM knowledge:', error);
  }

  const riskGuidance: Record<string, string> = {
    low: `Flag ALL deviations from market standard, including minor ones. Be exhaustive — the client is risk-averse and wants to see everything. Include informational notes about standard terms to build the client's understanding. Target: 8-15 issues. Include at least 1-2 "info" level items about terms that are actually favorable.`,
    medium: `Flag issues that materially impact deal economics, control, or legal risk. Include both actionable problems and noteworthy observations. Skip purely cosmetic issues (e.g., formatting, non-substantive definitions). Target: 5-10 issues. Focus on items where negotiation would meaningfully improve the deal.`,
    high: `Focus ONLY on critical and high-severity issues that could cause severe economic harm, loss of control, or legal invalidity. The client is moving fast and wants signal, not noise. Target: 3-7 issues. Every issue you flag should be worth a potentially difficult conversation with the investor.`,
  };

  const userPrompt = `Perform a comprehensive, clause-by-clause legal analysis of this ${docName}. Treat this as a real client engagement — your analysis will directly inform their negotiation strategy.

**COMPLETE DOCUMENT TEXT (analyze every clause from preamble to signature block):**
${matter.documentText}
${contextText}

**Risk Tolerance:** ${matter.riskTolerance.toUpperCase()}
**Analysis Calibration:** ${riskGuidance[matter.riskTolerance]}

**Audience:** ${matter.audience === 'founder' ? 'Startup Founder — explanations must be in plain English. No undefined legal jargon. Quantify economic impact in practical terms ("this could cost you $X at a $YM exit").' : 'Legal Counsel — technical analysis with statutory references, NVCA/YC benchmarks, and proposed counter-language.'}

Return a JSON object with your complete findings:
{
  "issues": [
    {
      "title": "Precise, specific, actionable issue title that a ${matter.audience === 'founder' ? 'founder' : 'lawyer'} can immediately understand. BAD: 'Valuation Cap Issue'. GOOD: 'Below-Market Valuation Cap at $8M (Market Median: $12M for Pre-Seed)'",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "clauseRef": "Section X.Y — [Exact Clause Name] (precise reference enabling the reader to find this in the document)",
      "explanation": "Thorough 4-6 sentence explanation covering: (1) What the specific provision says in the document, (2) How it deviates from the ${isSafe ? 'YC standard SAFE / market benchmark' : 'NVCA model term sheet / market benchmark'}, (3) The concrete economic or legal impact on the ${matter.audience === 'founder' ? 'founder — quantify in dollar terms where possible' : 'client — include statutory and case law references where applicable'}, (4) Why this matters in the context of THIS specific deal (not generic advice), (5) Any interaction effects with other clauses in the document",
      "confidence": 0.XX (calibrated per the framework above — be honest about uncertainty)
    }
  ]
}

**CRITICAL INSTRUCTIONS:**
- Analyze the COMPLETE document systematically, section by section. Do not skip any material provision.
- Order issues by severity (critical first, then high, medium, low, info)
- Each issue must reference a SPECIFIC clause in the document — no generic observations
- Do NOT fabricate terms that aren't in the document
- DO flag important protections that are MISSING from the document (e.g., no MFN clause, no pro-rata rights)
- Include at least one "info" level item about a term that is at or better than market standard, to give a balanced assessment`;

  let result: IssueAnalysisResult;
  try {
    result = await callLLMJSON<IssueAnalysisResult>(
      systemPrompt,
      userPrompt,
      { temperature: 0.2, maxTokens: 6000 }
    );
  } catch (error) {
    console.error('Issue analysis failed:', error);
    return { issues: [] };
  }

  const issues: Issue[] = (result.issues || []).map((issue) => ({
    ...issue,
    id: generateId(),
  }));

  // Update incrementally for real-time UI streaming
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
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return { issues };
}
