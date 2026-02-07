import { Matter, ParsedSection, DefinedTerm, MissingProvision } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface ParsingResult {
  sections: ParsedSection[];
  sectionCount: number;
  totalClauses: number;
  definedTerms: DefinedTerm[];
  missingProvisions: MissingProvision[];
  documentStructureAssessment: string;
  internalConsistencyIssues: string[];
}

export async function runParsing(matter: Matter): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';

  const systemPrompt = `You are a senior legal document analyst at a top-tier law firm, performing the first-pass structural review of a ${docName}. In real law firm practice, this is the associate's first task: create a complete structural map of the document before ANY substantive analysis begins.

**Your Document Review Protocol (mirrors Big Law first-pass review):**

**STEP 1 — Complete Structural Decomposition**
Identify ALL sections and sub-sections including:
- Preamble / Recitals / Whereas clauses (these often contain binding obligations disguised as recitals)
- Definitions section (the most important section — every defined term controls interpretation)
- Each operative section (numbered or unnumbered)
- Schedules, exhibits, and annexures
- Signature blocks, effective date provisions, counterpart clauses

For each section:
- Count individual operative clauses (sub-clauses (a), (b), (c) each count separately)
- Identify operative verbs (shall/must = mandatory, may = permissive, will = promissory)
- Note ALL cross-references to other sections (these create dependencies)
- Flag blank fields, TBD placeholders, or bracketed negotiation language
- Compare against the ${isSafe ? 'YC Post-Money SAFE standard form' : 'NVCA Model Term Sheet'} and note any deviations

**STEP 2 — Defined Terms Extraction (Critical for Interpretation)**
A real lawyer's FIRST action is to read every defined term. Defined terms control interpretation of the entire document. You must:
- Extract EVERY capitalized term that is explicitly defined
- Record the exact definition and where it appears
- Map cross-references (where else is this term used?)
- Flag any defined terms that deviate from standard ${isSafe ? 'YC SAFE' : 'NVCA'} definitions
- Flag any UNDEFINED capitalized terms (these create ambiguity — a major legal risk)
- Check for circular definitions (Term A defined by reference to Term B which references Term A)

**STEP 3 — Missing Provisions Identification**
Compare the document against the standard ${isSafe ? 'YC Post-Money SAFE form' : 'NVCA Model Term Sheet'} checklist. Identify any provisions that are:
- MISSING entirely (e.g., no MFN clause, no pro-rata rights, no information rights)
- Present but INCOMPLETE (e.g., partial protective provisions list)
- BLANK or TBD (e.g., "[To be determined]", "____")
Rate each missing provision by importance to the client.

**STEP 4 — Internal Consistency Audit**
Check for:
- Numbering gaps or duplicates (Section 3 followed by Section 5)
- Terms used but not defined, or defined but not used
- Cross-references that point to non-existent sections
- Conflicting provisions (Section 2 says X, Section 5 contradicts X)
- Ambiguous pronoun references in complex sentences

Be exhaustive — every structural issue you miss will propagate as an error through the entire analysis pipeline.`;

  const userPrompt = `Parse this ${docName} and produce a complete structural analysis suitable for a senior partner review. Analyze every word of the document.

**COMPLETE DOCUMENT TEXT (do NOT skip any section):**
${matter.documentText}

Return JSON with the complete parsed structure:
{
  "sections": [
    {
      "heading": "Full section identifier and title exactly as it appears (e.g., '1. Investment Amount', 'Section 3.2 — Protective Provisions'). If no formal heading, create: '[Untitled — Governing Law Provision]'",
      "clauseCount": precise count of individual operative clauses in this section (sub-clauses count separately),
      "content": "Comprehensive legal substance summary (5-8 sentences) covering: (1) Core legal effect, (2) ALL specific numbers/percentages/thresholds, (3) Conditions, carve-outs, exceptions, (4) Cross-references to other sections, (5) How this compares to the ${isSafe ? 'YC SAFE standard' : 'NVCA model'}, (6) Any blank/TBD items",
      "operativeVerbs": ["shall", "may", "must", etc. — the operative verbs used in this section],
      "crossReferences": ["List of other sections referenced from this section (e.g., 'Section 2', 'as defined in Section 1')"],
      "blankFields": ["Any blank fields, TBD items, or bracketed language in this section, or empty array"],
      "deviationFromStandard": "How this section deviates from the standard ${isSafe ? 'YC Post-Money SAFE' : 'NVCA model'} form, or 'Consistent with standard form' if no deviation"
    }
  ],
  "sectionCount": total number of sections,
  "totalClauses": sum of all clauseCount values,
  "definedTerms": [
    {
      "term": "The exact defined term as it appears (e.g., 'Equity Financing', 'Liquidity Event', 'Conversion Price')",
      "definition": "The complete definition from the document",
      "section": "Section where the term is defined",
      "crossReferences": ["Sections where this term is used"],
      "isStandard": true if the definition matches ${isSafe ? 'YC SAFE' : 'NVCA'} standard, false if it deviates,
      "concerns": "Any concerns about this definition (e.g., 'Broader than standard — includes asset sales which is atypical', 'Minimum financing threshold of $500K is below YC standard of $1M'), or null if no concerns"
    }
  ],
  "missingProvisions": [
    {
      "provision": "Name of the missing provision",
      "importance": "critical" | "important" | "recommended" | "optional",
      "explanation": "Why this provision matters and what risk its absence creates (2-3 sentences)",
      "standardLanguage": "Brief description of what the standard ${isSafe ? 'YC SAFE' : 'NVCA'} form includes for this provision, or null"
    }
  ],
  "documentStructureAssessment": "2-3 sentence overall assessment of the document's structural quality, completeness, and professionalism (e.g., 'This appears to be a modified YC Post-Money SAFE with 8 sections. The document is structurally sound but notably omits the MFN provision and has a blank section for additional terms. The definitions are largely standard with one material deviation in the Equity Financing threshold.')",
  "internalConsistencyIssues": ["List any internal consistency problems found: numbering gaps, undefined terms, broken cross-references, conflicting provisions. Empty array if none found."]
}

CRITICAL: Parse the ENTIRE document from first word to last. A ${isSafe ? 'SAFE typically has 6-12 sections' : 'term sheet typically has 8-25 sections'}. Include preamble, definitions, operative provisions, and miscellaneous sections.`;

  const result = await callLLMJSON<ParsingResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 6000 }
  );

  return {
    parsedSections: result.sections,
    definedTerms: result.definedTerms || [],
    missingProvisions: result.missingProvisions || [],
    stages: matter.stages.map((s) =>
      s.id === 'parsing'
        ? {
            ...s,
            data: {
              sectionCount: result.sectionCount,
              totalClauses: result.totalClauses,
              sections: result.sections,
              definedTerms: result.definedTerms || [],
              missingProvisions: result.missingProvisions || [],
              documentStructureAssessment: result.documentStructureAssessment,
              internalConsistencyIssues: result.internalConsistencyIssues || [],
            },
          }
        : s
    ),
  };
}
