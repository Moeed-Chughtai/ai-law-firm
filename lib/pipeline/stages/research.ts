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
}

interface ResearchResult {
  research: ResearchData;
}

async function researchSingleIssue(
  issue: Issue,
  matter: Matter
): Promise<Issue> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE' : 'Term Sheet';

  const systemPrompt = `You are a team of three elite legal research specialists working in parallel on a ${docName} review. Each specialist has deep expertise in their domain:

**Market Norms Specialist**: Expert in YC SAFE standards, NVCA model documents, Carta data, and PitchBook deal benchmarks. You know exact percentiles for every term.

**Risk Impact Specialist**: Expert in dilution modeling, cap table mechanics, liquidation waterfalls, and scenario analysis. You quantify economic impact precisely.

**Negotiation Strategy Specialist**: Expert in deal negotiation dynamics, counter-proposal frameworks, and founder leverage points. You've coached hundreds of founders through term negotiations.

Each specialist provides authoritative, data-driven analysis with specific numbers, percentages, and benchmarks. Never be vague.`;

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

  const userPrompt = `Research this legal issue comprehensively from three specialist perspectives:

**Issue:** ${issue.title}
**Severity:** ${issue.severity}
**Clause Reference:** ${issue.clauseRef}
**Explanation:** ${issue.explanation}

**Document Type:** ${docName}
**Document Excerpt:** ${matter.documentText.substring(0, 1500)}

${hasContext ? `**Market Data References:**
${formatChunksForPrompt(marketContext)}

**Risk Analysis References:**
${formatChunksForPrompt(riskContext)}

**Negotiation References:**
${formatChunksForPrompt(leverageContext)}` : ''}

Provide research from each specialist:

1. **Market Norms Specialist**: What are the EXACT current market standards for this term? What percentile does this document's term fall into? Cite YC, NVCA, or deal data. Include specific numbers (e.g., "75th percentile of pre-seed SAFEs have caps of $12-15M").

2. **Risk Impact Specialist**: Quantify the economic impact. Model specific scenarios (e.g., "In a $50M Series A, this term results in X% additional dilution vs. standard terms"). Include best/worst case analysis.

3. **Negotiation Leverage Specialist**: What specific counter-proposal should the founder make? What's the likelihood of success? What's the BATNA? Provide exact language or terms to propose.

Return JSON:
{
  "research": {
    "marketNorms": "Detailed market analysis with SPECIFIC data points, percentiles, and source references (4-6 sentences)",
    "riskImpact": "Detailed risk assessment with QUANTIFIED scenarios and economic modeling (4-6 sentences)",
    "negotiationLeverage": "Detailed negotiation strategy with SPECIFIC counter-proposals and success likelihood (4-6 sentences)"
  }
}`;

  const result = await callLLMJSON<ResearchResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxTokens: 2000 }
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
      // Merge researched issues with remaining unrearched ones
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
                completedAgents: researchedIssues.filter((i) => i.research).length * 3,
                totalAgents: issues.length * 3,
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
