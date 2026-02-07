import { Matter, ParsedSection } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface ParsingResult {
  sections: ParsedSection[];
  sectionCount: number;
  totalClauses: number;
}

export async function runParsing(matter: Matter): Promise<Partial<Matter>> {
  const systemPrompt = `You are an expert legal document parser with deep expertise in venture financing documentation. Your task is to produce a precise structural breakdown of the document, identifying every section, sub-section, and material clause. Be exhaustive — missing a section means missing potential legal issues downstream.

Key parsing rules:
- Identify ALL sections, even if they lack formal numbering
- Count individual operative clauses within each section (a clause = a distinct legal provision or obligation)
- Provide concise but complete summaries capturing the legal substance of each section
- Flag any unusual structural elements (blank sections, references to external documents, etc.)`;

  // Send the FULL document text for parsing — this is critical
  const userPrompt = `Parse this ${matter.docType === 'safe' ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Term Sheet'} document and extract its complete structure:

**FULL DOCUMENT TEXT:**
${matter.documentText}

Return JSON with the complete parsed structure:
{
  "sections": [
    {
      "heading": "Section number and full title (e.g., '1. Investment Amount' or 'Liquidation Preference')",
      "clauseCount": number of distinct operative clauses/provisions in this section,
      "content": "Comprehensive summary of the section's legal substance — include key terms, specific numbers/percentages, and any notable deviations from standard language (3-5 sentences)"
    }
  ],
  "sectionCount": total number of sections identified,
  "totalClauses": sum of all clauseCount values
}

Be thorough. Every section and sub-section should be captured. Include preamble/recitals if present.`;

  const result = await callLLMJSON<ParsingResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 4096 }
  );

  return {
    parsedSections: result.sections,
    stages: matter.stages.map((s) =>
      s.id === 'parsing'
        ? {
            ...s,
            data: {
              sectionCount: result.sectionCount,
              totalClauses: result.totalClauses,
              sections: result.sections,
            },
          }
        : s
    ),
  };
}
