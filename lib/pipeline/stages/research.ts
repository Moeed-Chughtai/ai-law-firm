import { Matter, Issue } from '../../types';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';
import {
  retrieveResearchContext,
  formatChunksForPrompt,
} from '../../rag/retrieval';
import { storeCitation } from '../../rag/vectorStore';

interface ResearchData {
  marketNorms: string;
  riskImpact: string;
  negotiationLeverage: string;
  precedents: string;
}

interface ResearchResult {
  research: ResearchData;
}

async function researchSingleIssue(
  issue: Issue,
  matter: Matter
): Promise<Issue> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';
  const audienceIsFounder = matter.audience === 'founder';

  const systemPrompt = `You are a council of four world-class specialists performing deep-dive research on a specific legal issue found in a ${docName}. Each specialist operates independently and contributes their unique expertise, but their combined output forms a cohesive research brief that mirrors how a real Big Law deal team researches issues.

**SPECIALIST 1 — Market Intelligence Analyst**
Profile: Former head of data analytics at Carta with a JD from Stanford. You maintain the most comprehensive private database of venture deal terms in the industry. You personally audit 500+ financing rounds per quarter and publish the authoritative market reports that lawyers and VCs cite.

Your research methodology:
- Pull exact percentile data for the term in question across 2023-2024 deals
- Segment by stage (pre-seed/seed/Series A/B), geography (SF Bay Area, NYC, rest-of-US, international), and sector (SaaS, biotech, fintech, hardware, AI/ML)
- ${isSafe ? 'Reference YC batch data (S23, W24, S24), Carta SAFE report, AngelList roll-up data' : 'Reference PitchBook benchmarks, NVCA surveys, Fenwick & West Silicon Valley Venture Financing reports'}
- Compare against both median AND 25th/75th percentile to show the full distribution
- Note any temporal trends (is this term getting more or less common?)

**SPECIALIST 2 — Financial Modeling & Risk Quantification Expert**
Profile: Former Goldman Sachs VP turned startup CFO advisor. CFA charterholder. You build institutional-grade cap table models used by top law firms. You think in waterfalls, scenarios, and expected values.

Your research methodology:
- Build scenario models at 3+ valuation points (realistic, optimistic, downside)
- ${isSafe ? 'Model conversion economics: dilution at various Series A pre-money valuations ($15M, $30M, $60M, $100M), interaction between cap and discount, comparison of post-money vs pre-money SAFE mechanics' : 'Model liquidation waterfalls at $50M, $100M, $200M, $500M exits; model dilution from anti-dilution triggers in a 50% down round; model board control scenarios'}
- Quantify the DELTA between what this document says and what market standard says — in dollars and basis points
- Consider second-order effects (how does this term interact with likely future rounds?)
- ${audienceIsFounder ? 'Express results as "this costs you $X at a $Y exit" or "this is equivalent to giving away Z% of your company"' : 'Express results with precise cap table arithmetic and sensitivity tables'}

**SPECIALIST 3 — Negotiation Strategist & Deal Tactician**
Profile: Senior partner at Cooley LLP's emerging companies group. You have closed 3,000+ venture deals and trained a generation of startup lawyers. You wrote the playbook on SAFE/term sheet negotiation.

Your research methodology:
- Assess the realistic negotiation landscape: how firm is this term likely to be?
- Provide a SPECIFIC counter-proposal with exact language/numbers, not vague suggestions
- Grade the likelihood of success: "near-certain" (>90%), "likely" (70-90%), "possible" (40-70%), "unlikely" (<40%)
- Identify the BATNA (Best Alternative To Negotiated Agreement) and walk-away point
- ${audienceIsFounder ? 'Provide a script: "You could say to the investor: [exact words]". Include the emotional/relational framing, not just legal arguments.' : 'Provide markup language and cite precedent for why the counter-position is standard.'}
- Consider package dealing: what could be traded for concession on this term?

**SPECIALIST 4 — Legal Precedent & Authority Researcher (NEW — mirrors real firm memo research)**
Profile: Senior associate and head of the firm's legal research team. You clerked at the Delaware Court of Chancery and are the go-to authority on corporate governance litigation. You have access to Westlaw, LexisNexis, and the firm's internal precedent database.

Your research methodology:
- Identify the controlling legal authority for this issue (statute, regulation, case law)
- ${isSafe ? `Reference relevant Delaware case law on SAFE enforceability and conversion disputes
  - Cite DGCL provisions that apply to the conversion mechanics
  - Note any SEC no-action letters or guidance on SAFE treatment
  - Reference relevant IRS guidance on tax treatment of SAFEs
  - Identify any pending legislation or regulatory changes that could affect this term` : `Reference key Delaware cases on preferred stock rights (e.g., In re Trados, SV Inv. Partners v. ThoughtWorks)
  - Cite specific DGCL sections (§§ 141, 151, 202, 242, 251)
  - Note fiduciary duty implications (Revlon duties, entire fairness standard)
  - Reference relevant SEC guidance on disclosure and registration
  - Identify any recent Delaware Court of Chancery decisions affecting these provisions`}
- Distinguish between binding authority and persuasive authority
- Note any circuit splits or areas of legal uncertainty
- Provide the weight of authority: "Well-settled law" vs. "Emerging area" vs. "Unsettled/disputed"

**Cross-Specialist Integration Rule:** Each specialist should acknowledge what the others would find and ensure no contradictions. If market data suggests a term is standard, the negotiation specialist should adjust their strategy accordingly. The legal authority specialist should validate that proposed negotiation positions are legally sound.`;

  // Retrieve context for all three research types in parallel
  let marketContext: any[] = [];
  let riskContext: any[] = [];
  let leverageContext: any[] = [];

  try {
    [marketContext, riskContext, leverageContext] = await Promise.all([
      retrieveResearchContext(issue.title, 'marketNorms', matter).catch(() => []),
      retrieveResearchContext(issue.title, 'riskImpact', matter).catch(() => []),
      retrieveResearchContext(issue.title, 'negotiationLeverage', matter).catch(() => []),
    ]);
  } catch {
    // Continue without RAG context
  }

  const hasContext = marketContext.length > 0 || riskContext.length > 0 || leverageContext.length > 0;

  const userPrompt = `**RESEARCH BRIEF REQUEST — ${issue.severity.toUpperCase()} SEVERITY ISSUE**

Perform comprehensive four-specialist research on the following issue identified during legal review:

**Issue Title:** ${issue.title}
**Severity:** ${issue.severity}
**Category:** ${issue.category || 'Not categorized'}
**Clause Reference:** ${issue.clauseRef}
**Analysis Summary:** ${issue.explanation}
**Confidence Level:** ${issue.confidence}
**Standard Form Deviation:** ${issue.standardFormDeviation || 'Not specified'}
**Cross-Clause Interactions:** ${issue.interactionEffects?.join('; ') || 'None identified'}
**Statutory Basis:** ${issue.statutoryBasis || 'Not specified'}

**Full Document Context (for cross-reference):**
${matter.documentText.substring(0, 2500)}

**Client Profile:**
- Risk Tolerance: ${matter.riskTolerance}
- Audience: ${audienceIsFounder ? 'Startup Founder (non-lawyer)' : 'Legal Counsel'}
${matter.riskTolerance === 'low' ? '- Client is risk-averse; emphasize protective positions and worst-case scenarios' : matter.riskTolerance === 'high' ? '- Client is risk-tolerant and moving fast; focus on true deal-breakers only' : '- Client has balanced risk tolerance; weigh speed-to-close against protection'}

${hasContext ? `**KNOWLEDGE BASE REFERENCES (retrieved from legal document database):**

Market Data References:
${formatChunksForPrompt(marketContext)}

Risk Analysis References:
${formatChunksForPrompt(riskContext)}

Negotiation Precedent References:
${formatChunksForPrompt(leverageContext)}

Use these references to ground your analysis, but supplement with your broader expertise.` : ''}

**DELIVER FOUR SPECIALIST REPORTS:**

**Specialist 1 — Market Intelligence Report:**
Provide 5-7 sentences covering: (a) The exact market standard for this term with percentile data, (b) How this document's term compares — is it at 25th, 50th, 75th, or 99th percentile?, (c) Segmented data by deal stage and geography where relevant, (d) Recent trend direction (is market moving toward or away from this term?), (e) Any notable reference points (e.g., "YC's standard post-money SAFE uses X", "NVCA model language says Y").

**Specialist 2 — Financial Impact Report:**
Provide 5-7 sentences covering: (a) Concrete economic impact modeled at ${isSafe ? 'Series A valuations of $20M, $50M, and $100M pre-money' : 'exit values of $50M, $100M, and $250M'}, (b) The dollar-value DELTA between this term and market standard, (c) ${isSafe ? 'Dilution percentage difference and effective valuation impact' : 'Liquidation waterfall impact and effective return multiples'}, (d) Second-order effects (how does this interact with future financing rounds?), (e) Best/base/worst case scenario summary. ${audienceIsFounder ? 'Express all figures in plain dollar terms.' : 'Include cap table arithmetic.'}

**Specialist 3 — Negotiation Strategy Report:**
Provide 5-7 sentences covering: (a) A SPECIFIC counter-proposal with exact terms/numbers/language to propose, (b) Success likelihood assessment with reasoning, (c) The BATNA — what is the walk-away point and what's the cost of accepting vs. walking?, (d) ${audienceIsFounder ? 'A suggested script for the conversation with the investor, including tone/framing' : 'Proposed markup language with legal justification'}, (e) Package deal opportunities — what could be traded for this concession?, (f) Whether to negotiate this early (signal importance) or late (horse-trading leverage).

**Specialist 4 — Legal Authority & Precedent Report:**
Provide 5-7 sentences covering: (a) The controlling legal authority (statutes, regulations, case law) that governs this issue, (b) ${isSafe ? 'Relevant DGCL provisions, SEC guidance, or IRS treatment of SAFEs' : 'Specific DGCL sections, Delaware Court of Chancery decisions, and fiduciary duty standards'}, (c) How courts have treated disputes involving similar provisions, (d) Whether the proposed recommendation is on solid legal ground, (e) Any areas of legal uncertainty or unsettled law that affect confidence, (f) Weight of authority assessment: "well-settled" vs "emerging" vs "uncertain/disputed".

Return JSON:
{
  "research": {
    "marketNorms": "Complete Specialist 1 report as a single paragraph",
    "riskImpact": "Complete Specialist 2 report as a single paragraph",
    "negotiationLeverage": "Complete Specialist 3 report as a single paragraph",
    "precedents": "Complete Specialist 4 report as a single paragraph"
  }
}`;

  const result = await callLLMJSON<ResearchResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxTokens: 4000 }
  );

  // Store citations in background (don't block)
  const allChunks = [...marketContext, ...riskContext, ...leverageContext];
  if (allChunks.length > 0) {
    Promise.all(
      allChunks.map((chunk) =>
        storeCitation(
          matter.id,
          issue.id,
          chunk.id,
          chunk.relevanceScore,
          `Used in ${issue.title} research`
        ).catch(() => {})
      )
    ).catch(() => {});
  }

  return {
    ...issue,
    research: result.research,
  };
}

export async function runResearch(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];

  // Process issues in parallel batches of 3 for speed
  const BATCH_SIZE = 3;
  const researchedIssues: Issue[] = [];

  for (let batchStart = 0; batchStart < issues.length; batchStart += BATCH_SIZE) {
    const batch = issues.slice(batchStart, batchStart + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((issue) =>
        researchSingleIssue(issue, matter).catch((error) => {
          console.error(`Research failed for issue ${issue.id}:`, error);
          return issue; // Return unresearched issue on failure
        })
      )
    );

    researchedIssues.push(...batchResults);

    // Update incrementally after each batch
    const current = await getMatter(matter.id);
    if (current) {
      const updatedIssues = [
        ...researchedIssues,
        ...issues.slice(researchedIssues.length),
      ];
      current.issues = updatedIssues;
      current.stages = current.stages.map((s) =>
        s.id === 'research'
          ? {
              ...s,
              data: {
                completedAgents: researchedIssues.filter((i) => i.research).length * 4,
                totalAgents: issues.length * 4,
                parallelRuns: Math.min(BATCH_SIZE, batch.length),
                issues: updatedIssues,
              },
            }
          : s
      );
      await setMatter(current);
    }
  }

  return { issues: researchedIssues };
}
