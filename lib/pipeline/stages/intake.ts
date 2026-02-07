import { Matter } from '../../types';
import { callLLMJSON } from '../../ai/openai';

interface IntakeData {
  detectedDocType: string;
  jurisdictionConfirmed: string;
  jurisdictionLocked: boolean;
  allowedScope: string[];
  matterAccepted: boolean;
  refusalReason: string | null;
  riskProfile: string;
  audienceMode: string;
  documentComplexity: 'simple' | 'moderate' | 'complex';
  estimatedIssues: number;
  keyParties: string[];
  documentDate: string | null;
  investmentAmount: string | null;
  preliminaryFlags: string[];
}

export async function runIntake(matter: Matter): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Venture Capital Term Sheet';

  const systemPrompt = `You are an elite legal intake specialist at a top-tier Silicon Valley law firm (Fenwick, Cooley, WSGR caliber) specializing in venture financing. You have personally reviewed over 5,000 SAFEs, convertible notes, and term sheets across every stage from pre-seed to Series D.

Your intake process is modeled on Big Law best practices:
1. **Document Authentication**: Verify the document is a genuine ${docName}, not a different instrument (e.g., convertible note, equity grant, employment agreement)
2. **Jurisdiction Determination**: Identify governing law from the document itself; flag conflicts between stated jurisdiction and standard practice
3. **Complexity Triage**: Assess whether the document contains non-standard provisions, side letters, or unusual amendments that increase complexity
4. **Scope Definition**: Map every substantive clause to a specific analysis workstream — missing a workstream means missing critical issues downstream
5. **Preliminary Red Flags**: Identify any immediately visible concerns (e.g., missing MFN clause, unusual liquidation preferences, atypical anti-dilution) before deep analysis begins
6. **Party Identification**: Extract the key parties and their roles

You must be exhaustive in scope definition. A missed scope area = a missed legal risk.`;

  // Send more document text for better analysis
  const docPreview = matter.documentText.substring(0, 5000);

  const riskDescriptions: Record<string, string> = {
    low: 'Conservative — flag ALL deviations from YC/NVCA standard forms, including minor ones. The client wants comprehensive protection and is willing to negotiate aggressively. Include informational notes about terms that could theoretically be improved.',
    medium: 'Balanced — flag material issues that impact deal economics (dilution >2% from standard), control rights, or create legal risk. Skip purely cosmetic issues but catch anything a prudent lawyer would flag in a client memo.',
    high: 'Aggressive — focus only on critical and high-severity issues that could cause severe economic harm, loss of control, or legal liability. The client values speed and is comfortable with standard market terms even if slightly investor-favorable.',
  };

  const userPrompt = `Perform a comprehensive intake assessment on this submitted document. This assessment shapes the entire downstream analysis pipeline — be thorough.

**Requested Document Type:** ${docName}
**Client Risk Tolerance:** ${matter.riskTolerance.toUpperCase()}
${riskDescriptions[matter.riskTolerance]}
**Target Audience:** ${matter.audience === 'founder' ? 'Startup Founder (non-lawyer — all output must be in plain English with clear action items)' : 'Legal Counsel (technical analysis with statutory citations, NVCA/YC standard references, and legal reasoning)'}

**FULL DOCUMENT TEXT (analyze every line):**
${docPreview}

Provide your intake assessment as JSON:
{
  "detectedDocType": "Full formal name of the document type detected from actual content analysis (e.g., 'Post-Money SAFE with Valuation Cap and Discount', 'Series A Preferred Stock Term Sheet')",
  "jurisdictionConfirmed": "Jurisdiction detected from governing law clause, or 'Delaware' if not specified",
  "jurisdictionLocked": true,
  "allowedScope": ["Array of 10-15 SPECIFIC analysis workstreams tailored to this exact document. Each should be a precise analysis task, not a generic area. E.g.: 'Valuation cap benchmarking against current YC standard ($10-15M pre-seed)', 'Discount rate analysis (20% standard) and interaction with cap', 'MFN clause completeness and enforceability review', 'Conversion mechanics — Safe Preferred Stock vs Common Stock terms', 'Liquidation preference waterfall modeling (1x non-participating standard)', 'Anti-dilution protection type and scope assessment', 'Pro-rata rights threshold analysis and practical exercisability', 'Board composition and voting control dynamics', 'Protective provisions scope vs NVCA standard form', 'Information rights and reporting obligation assessment', 'Drag-along/tag-along provision analysis', 'Redemption rights and forced exit mechanism review', 'Employee option pool size and pre/post-money treatment', 'Representations and warranties completeness check'"],
  "matterAccepted": true,
  "refusalReason": null,
  "riskProfile": "${matter.riskTolerance} — [2-3 sentences describing the specific analysis approach that will be used, calibrated to this risk level]",
  "audienceMode": "${matter.audience === 'founder' ? 'Founder Mode: All explanations in plain English. Every recommendation starts with a clear action verb. Technical terms defined inline. Economic impact quantified in practical scenarios.' : 'Counsel Mode: Full technical analysis with DGCL/UCC references. Cite NVCA model documents and YC standard forms. Include proposed markup language. Reference relevant case law where applicable.'}",
  "documentComplexity": "simple" | "moderate" | "complex",
  "estimatedIssues": estimated number of issues (calibrate to risk tolerance: low=8-15, medium=5-10, high=3-7),
  "keyParties": ["List of key parties identified in the document (company name, investor name, etc.)"],
  "documentDate": "Date of document if found, or null",
  "investmentAmount": "Investment/purchase amount if stated, or null",
  "preliminaryFlags": ["Array of 2-4 immediately visible concerns or notable provisions spotted during intake — these help calibrate the downstream analysis. E.g.: 'Valuation cap appears below current market median', 'No MFN clause detected', 'Participating preferred with uncapped participation']"
}`;

  const scopeDecisions = await callLLMJSON<IntakeData>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 2500 }
  );

  return {
    stages: matter.stages.map((s) =>
      s.id === 'intake' ? { ...s, data: scopeDecisions } : s
    ),
  };
}
