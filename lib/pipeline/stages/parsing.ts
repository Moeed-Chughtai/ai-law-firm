import { Matter, ParsedSection } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface ParsingResult {
  sections: ParsedSection[];
  sectionCount: number;
  totalClauses: number;
}

export async function runParsing(matter: Matter): Promise<Partial<Matter>> {
  const systemPrompt = `You are a legal document parser. Extract the structure of the document, identifying all major sections, headings, and clause counts.`;

  const userPrompt = `Parse this ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'} document and extract its structure:

${matter.documentText.substring(0, 4000)}

Return JSON with:
{
  "sections": [
    {
      "heading": "Section number and title",
      "clauseCount": number of clauses in this section,
      "content": "Brief summary of section content (2-3 sentences)"
    }
  ],
  "sectionCount": total number of sections,
  "totalClauses": sum of all clause counts
}`;

  const result = await callLLMJSON<ParsingResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1 }
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
