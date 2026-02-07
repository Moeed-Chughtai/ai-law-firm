import { Matter, Issue, Severity, IssueCategory } from '../../types';
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
  category: IssueCategory;
  interactionEffects: string[];
  statutoryBasis: string;
  standardFormDeviation: string;
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

3. **Cross-Clause Interaction Analysis (CRITICAL — most firms miss this)**
   This is where real legal expertise shows. Analyze how clauses INTERACT:
   ${isSafe ? `• Does the valuation cap interact with the discount to create unintended dilution?
   • Do the conversion mechanics properly handle the MFN interaction?
   • Does the dissolution provision interact with the liquidation preference?
   • Do the pro-rata rights definition and the equity financing threshold create a gap?
   • Are defined terms used consistently across sections?` : `• Does the anti-dilution interact badly with the option pool size?
   • Do the liquidation preference and participation rights compound?
   • Does the board composition allow protective provision vetoes to be circumvented?
   • Do the drag-along threshold and protective provisions conflict?
   • Does the information rights scope match what the board needs for governance?
   • Do the ROFR/co-sale provisions interact with the drag-along?`}

4. **Missing Provisions Analysis**
   Real lawyers don't just analyze what IS in the document — they identify what's MISSING:
   ${isSafe ? `• MFN clause (critical investor protection)
   • Information rights (standard in most SAFEs)
   • Amendment provisions (how can this SAFE be modified?)
   • Assignment restrictions
   • Investor rights on qualified financing
   • Side letter provisions` : `• Pay-to-play provisions (protects against down rounds)
   • Registration rights (S-1 demand, piggyback, S-3)
   • Founder vesting/acceleration provisions
   • ROFR/co-sale provisions
   • No-shop/exclusivity period
   • Employee non-compete/non-solicit
   • D&O insurance requirements
   • Key person insurance
   • Expense cap/reimbursement provisions`}

5. **Statutory & Legal Basis**
   For each issue, identify the legal framework that applies:
   ${isSafe ? `• Delaware General Corporation Law (DGCL) provisions
   • Securities Act exemptions relied upon (Reg D, Rule 506)
   • State blue sky law considerations
   • UCC Article 8 (for security interests in the SAFE)` : `• DGCL §§ 141-144 (board of directors duties and composition)
   • DGCL § 151 (classes and series of stock)
   • DGCL § 202 (transfer restrictions)
   • DGCL § 228 (written consents)
   • DGCL § 242 (charter amendments)
   • DGCL § 251-252 (mergers)
   • Federal securities law implications`}

6. **Issue Categorization**
   Categorize each issue into one of these practice area categories:
   - economics: Valuation, dilution, conversion, pricing
   - control: Board composition, voting rights, consent rights
   - governance: Corporate governance, fiduciary duties
   - protective_provisions: Investor veto rights, protective covenants
   - information_rights: Reporting, inspection, access rights
   - transfer_restrictions: ROFR, co-sale, lock-up, drag-along
   - exit_mechanisms: Liquidation, redemption, IPO provisions
   - representations: Reps & warranties, conditions, covenants
   - missing_provision: Standard provisions that are absent
   - definitional: Defined terms that deviate or create ambiguity
   - procedural: Notice, amendment, assignment, waiver provisions
   - other: Anything else

7. **Severity Calibration (be precise — your reputation depends on this)**
   - **Critical** (deal-breaker): Could result in loss of company control, >10% unexpected dilution, or legal invalidity. Requires immediate renegotiation.
   - **High** (significant risk): Material economic impact (2-10% dilution), meaningful control concession, or deviation from market that most lawyers would flag.
   - **Medium** (moderate concern): Non-standard provision that warrants discussion but isn't a deal-breaker.
   - **Low** (minor): Slightly atypical but generally within acceptable range. Worth understanding.
   - **Info** (educational): Standard or better-than-standard provision. Included to show complete analysis.

8. **Confidence Calibration**
   - 0.95-1.0: Black-letter law issue or clear mathematical deviation
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
□ Governing law and dispute resolution mechanism
□ Assignment and transfer restrictions
□ Amendment provisions — can terms be changed without investor consent?` : `**Term Sheet Deep Analysis Checklist:**
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
□ Founder vesting — acceleration triggers, cliff, repurchase rights
□ Expense cap — investor legal fee reimbursement cap
□ Conditions to closing — any unusual conditions precedent`}`;

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

**STRUCTURAL ANALYSIS FROM PARSING STAGE (use this to ensure complete coverage):**
Sections identified: ${matter.parsedSections?.length || 0}
${matter.parsedSections?.map(s => `• ${s.heading} (${s.clauseCount} clauses)${s.deviationFromStandard && s.deviationFromStandard !== 'Consistent with standard form' ? ` ⚠️ ${s.deviationFromStandard}` : ''}`).join('\n') || 'No parsing data available'}

**DEFINED TERMS EXTRACTED (check each for deviation from standard):**
${matter.definedTerms?.map(dt => `• "${dt.term}" — ${dt.isStandard ? '✅ Standard' : '⚠️ Non-standard'}${dt.concerns ? ` — ${dt.concerns}` : ''}`).join('\n') || 'No defined terms extracted'}

**MISSING PROVISIONS IDENTIFIED (each should generate an issue):**
${matter.missingProvisions?.map(mp => `• ${mp.provision} [${mp.importance}] — ${mp.explanation}`).join('\n') || 'No missing provisions identified'}
${contextText}

**Risk Tolerance:** ${matter.riskTolerance.toUpperCase()}
**Analysis Calibration:** ${riskGuidance[matter.riskTolerance]}

**Audience:** ${matter.audience === 'founder' ? 'Startup Founder — explanations must be in plain English. No undefined legal jargon. Quantify economic impact in practical terms ("this could cost you $X at a $YM exit").' : 'Legal Counsel — technical analysis with statutory references, NVCA/YC benchmarks, and proposed counter-language.'}

Return a JSON object with your complete findings:
{
  "issues": [
    {
      "title": "Precise, specific, actionable issue title. BAD: 'Valuation Cap Issue'. GOOD: 'Below-Market Valuation Cap at $8M (Market Median: $12M for Pre-Seed)'",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "clauseRef": "Section X.Y — [Exact Clause Name]",
      "category": "economics" | "control" | "governance" | "protective_provisions" | "information_rights" | "transfer_restrictions" | "exit_mechanisms" | "representations" | "missing_provision" | "definitional" | "procedural" | "other",
      "explanation": "Thorough 4-6 sentence explanation covering: (1) What the provision says, (2) How it deviates from the ${isSafe ? 'YC standard SAFE / market benchmark' : 'NVCA model term sheet / market benchmark'}, (3) Concrete economic or legal impact, (4) Why this matters for THIS specific deal, (5) Any interaction effects with other clauses",
      "interactionEffects": ["List specific cross-clause interactions. E.g., 'Interacts with Section 2 (Valuation Cap) — the 25% discount combined with the $8M cap creates a double-discount scenario at Series A valuations below $10.67M', 'Absence of MFN means investor cannot benefit from better terms in subsequent SAFEs'. Empty array if no interactions."],
      "statutoryBasis": "The legal framework that makes this issue important. E.g., 'DGCL § 151 governs the creation of preferred stock classes; deviation from standard conversion mechanics could create enforceability issues' or 'Securities Act § 4(a)(2) and Rule 506(b) — the minimum investment threshold affects the exemption relied upon'. Use 'Market practice standard' if no specific statute applies.",
      "standardFormDeviation": "Precise description of how this deviates from the standard form. E.g., 'YC Post-Money SAFE v1.1 uses a $1M minimum Equity Financing threshold; this document uses $500K, which is 50% lower and could trigger conversion on a smaller bridge round' or 'NVCA Model Term Sheet specifies broad-based weighted average anti-dilution; this document uses full ratchet, which is significantly more investor-favorable and seen in only ~5% of Series A deals'",
      "confidence": 0.XX
    }
  ]
}

**CRITICAL INSTRUCTIONS:**
- Analyze EVERY section identified in the parsing stage. Do not skip any.
- Include issues for EVERY missing provision identified in parsing (use category "missing_provision")
- Include issues for any non-standard defined terms (use category "definitional")
- Order issues by severity (critical first, then high, medium, low, info)
- Each issue must reference a SPECIFIC clause — no generic observations
- Do NOT fabricate terms that aren't in the document
- DO flag important protections that are MISSING
- Cross-reference between clauses — identify ALL interaction effects
- Include at least one "info" level item about a favorable term for balanced assessment
- Every issue must have a category, interaction effects array, statutory basis, and standard form deviation`;

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
