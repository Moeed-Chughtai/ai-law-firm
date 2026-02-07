import { Matter, ParsedSection } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface ParsingResult {
  sections: ParsedSection[];
  sectionCount: number;
  totalClauses: number;
}

export async function runParsing(matter: Matter): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';

  const systemPrompt = `You are an expert legal document parser with deep expertise in venture financing documentation, trained on thousands of ${docName}s. Your task is to produce a precise, exhaustive structural breakdown of this document.

**Parsing Framework:**
1. **Section Identification**: Identify ALL sections and sub-sections, including:
   - Preamble / Recitals / Whereas clauses
   - Definitions section (critical for interpretation)
   - Each operative section (numbered or unnumbered)
   - Schedules, exhibits, and annexures
   - Signature blocks and effective date provisions

2. **Clause-Level Granularity**: Within each section, count INDIVIDUAL operative clauses. A clause is a distinct legal provision, obligation, right, or condition. Sub-clauses (a), (b), (c) each count separately. Definitions each count as individual clauses.

3. **Content Extraction Standards**:
   - Capture the precise legal substance, not just a topic summary
   - Include ALL specific numbers, percentages, dollar amounts, dates, and thresholds
   - Note any cross-references to other sections
   - Flag blank fields, TBD placeholders, or bracketed negotiation language
   - Identify any carve-outs, exceptions, or conditions
   - Note the operative verbs (shall, may, will, must) — these define obligation strength

4. **Structural Anomalies**: Flag:
   - Missing standard sections for this document type
   - Sections that reference external documents not provided
   - Unusually long or short sections relative to standard forms
   - Sections with internally inconsistent numbering

Be exhaustive — every clause you miss is a potential legal risk that goes unanalyzed.`;

  const userPrompt = `Parse this ${docName} and extract its complete legal structure. Analyze every word.

**COMPLETE DOCUMENT TEXT (do NOT skip any section):**
${matter.documentText}

Return JSON with the complete parsed structure:
{
  "sections": [
    {
      "heading": "Full section identifier and title exactly as it appears in the document (e.g., '1. Investment Amount', 'Section 3.2 — Protective Provisions', 'RECITALS'). If no formal heading exists, create a descriptive one in brackets like '[Untitled — Governing Law Provision]'",
      "clauseCount": precise count of individual operative clauses/provisions in this section (count sub-clauses separately: (a), (b), (c) = 3 clauses),
      "content": "Comprehensive legal substance summary (5-8 sentences). MUST include: (1) The core legal effect of this section, (2) ALL specific numbers/percentages/thresholds with their exact values, (3) Any conditions, carve-outs, or exceptions, (4) Cross-references to other sections, (5) How this section compares to the standard ${isSafe ? 'YC SAFE' : 'NVCA'} form (note any deviations), (6) Any blank fields, TBD items, or bracketed negotiation language"
    }
  ],
  "sectionCount": total number of sections identified (should be at least ${isSafe ? '6-10 for a standard SAFE' : '10-20 for a standard term sheet'}),
  "totalClauses": sum of all clauseCount values
}

CRITICAL: Parse the ENTIRE document from first word to last. Include preamble, recitals, definitions, operative provisions, miscellaneous sections, and any exhibits. A well-structured ${isSafe ? 'SAFE typically has 6-10 sections' : 'term sheet typically has 10-25 sections'}.`;

  const result = await callLLMJSON<ParsingResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 6000 }
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
