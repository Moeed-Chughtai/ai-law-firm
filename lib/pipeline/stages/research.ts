import { Matter, Issue } from '../../types';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';
import {
  retrieveResearchContext,
  formatChunksForPrompt,
  storeCitation,
} from '../../rag/retrieval';

interface ResearchData {
  marketNorms: string;
  riskImpact: string;
  negotiationLeverage: string;
}

interface ResearchResult {
  research: ResearchData;
}

export async function runResearch(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];
  const researchedIssues: Issue[] = [];

  // Simulate parallel agent research
  for (const issue of issues) {
    const systemPrompt = `You are a legal research specialist. You analyze startup financing issues from three perspectives: market norms, risk impact, and negotiation leverage. Use the provided legal references and market data to ensure accuracy.`;

    // Retrieve context for each research type
    const [marketContext, riskContext, leverageContext] = await Promise.all([
      retrieveResearchContext(issue.title, 'marketNorms', matter),
      retrieveResearchContext(issue.title, 'riskImpact', matter),
      retrieveResearchContext(issue.title, 'negotiationLeverage', matter),
    ]);

    const userPrompt = `Research this legal issue in the context of a ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}:

Issue: ${issue.title}
Severity: ${issue.severity}
Clause: ${issue.clauseRef}
Explanation: ${issue.explanation}

Document Context:
${matter.documentText.substring(0, 2000)}

Market Norms References:
${formatChunksForPrompt(marketContext)}

Risk Analysis References:
${formatChunksForPrompt(riskContext)}

Negotiation References:
${formatChunksForPrompt(leverageContext)}

Provide research from three agent perspectives:

1. Market Norms Agent: What are the current market standards for this clause? What do YC, NVCA, and industry benchmarks say? What percentile does this fall into? Cite specific references.

2. Risk Impact Agent: What are the concrete risks and potential outcomes? Quantify the impact where possible (dilution percentages, exit scenarios, etc.). Use precedent data when available.

3. Negotiation Leverage Agent: What leverage does the founder have? What are standard counter-proposals? What's the likelihood of negotiation success? Reference similar negotiations.

Return JSON:
{
  "research": {
    "marketNorms": "Detailed market analysis with citations (3-4 sentences)",
    "riskImpact": "Detailed risk assessment with quantification (3-4 sentences)",
    "negotiationLeverage": "Detailed negotiation strategy with examples (3-4 sentences)"
  }
}`;

    try {
      const result = await callLLMJSON<ResearchResult>(
        systemPrompt,
        userPrompt,
        { temperature: 0.4, maxTokens: 1500 }
      );

      researchedIssues.push({
        ...issue,
        research: result.research,
      });

      // Store citations
      for (const chunk of [...marketContext, ...riskContext, ...leverageContext]) {
        await storeCitation(
          matter.id,
          issue.id,
          chunk.id,
          chunk.relevanceScore,
          `Used in ${issue.title} research`
        );
      }

      // Update incrementally
      const current = await getMatter(matter.id);
      if (current) {
        current.issues = researchedIssues.concat(
          issues.slice(researchedIssues.length)
        );
        current.stages = current.stages.map((s) =>
          s.id === 'research'
            ? {
                ...s,
                data: {
                  completedAgents: researchedIssues.length * 3,
                  totalAgents: issues.length * 3,
                  parallelRuns: 3,
                  issues: current.issues,
                },
              }
            : s
        );
        await setMatter(current);
      }
    } catch (error) {
      console.error(`Research failed for issue ${issue.id}:`, error);
      // Fallback to issue without research
      researchedIssues.push(issue);
    }
  }

  return { issues: researchedIssues };
}
