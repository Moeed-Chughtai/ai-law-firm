import { Matter, ConflictCheck, EngagementScope } from '../../types';
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
  conflictCheck: ConflictCheck;
  engagementScope: EngagementScope;
  governingLaw: string;
  disputeResolution: string;
  instrumentClassification: string;
  urgencyLevel: 'routine' | 'expedited' | 'urgent';
}

export async function runIntake(matter: Matter): Promise<Partial<Matter>> {
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Venture Capital Term Sheet';

  const systemPrompt = `You are the intake partner at a top-tier Silicon Valley law firm (Fenwick, Cooley, WSGR caliber) running the New Matter Opening process for a venture financing engagement. You have personally opened over 5,000 matters spanning SAFEs, convertible notes, and term sheets across every stage from pre-seed to Series D.

Your intake process mirrors Big Law new matter procedures exactly:

**PHASE 1 — CONFLICT CHECK (Mandatory, must complete before accepting engagement)**
Every law firm must run a conflicts check before accepting new work. You must:
1. Extract ALL parties named or referenced in the document (company, investors, board members, counsel, agents)
2. Identify potential adverse parties and counterparties
3. Assess whether representing this client on this matter could create a conflict with any obligations
4. Determine if an ethical wall or waiver would be needed
5. Clear or flag the conflict for partner review

**PHASE 2 — DOCUMENT AUTHENTICATION & CLASSIFICATION**
Before analysis begins, validate:
1. Is this actually a ${docName}? Could it be a different instrument (convertible note, equity purchase agreement, warrant, option grant)?
2. Is the document complete? Are there missing pages, unsigned sections, or reference documents not provided?
3. What version/vintage is this? (YC standard form? NVCA model? Custom law firm draft?)
4. Identify the governing law clause and dispute resolution mechanism
5. Classify the instrument precisely (e.g., "Post-Money SAFE with Valuation Cap and Discount" vs "Pre-Money SAFE with Cap Only")

**PHASE 3 — ENGAGEMENT SCOPE DEFINITION**
A real law firm defines the scope BEFORE starting work:
1. What specific work is the client retaining us to do? (review only? negotiate? draft counter-terms?)
2. What are the explicit LIMITATIONS of this engagement? (not providing tax advice, not opining on IP, etc.)
3. What assumptions is the analysis based on? (document is final draft, no side letters exist, etc.)
4. What qualifications/caveats apply? (analysis based on document as provided, no factual investigation, etc.)
5. What is the estimated timeline for delivery?

**PHASE 4 — COMPLEXITY TRIAGE & SCOPE MAPPING**
1. Assess document complexity (simple/moderate/complex) based on non-standard terms, structural novelty
2. Map every substantive clause to a specific analysis workstream — missing a workstream = missing a risk
3. Identify preliminary red flags visible without deep analysis
4. Estimate the number of issues that will be found (calibrated to risk tolerance)

You must be exhaustive. Missing a conflict, miclassifying the instrument, or under-scoping the engagement are all malpractice risks.`;

  const docPreview = matter.documentText.substring(0, 5000);

  const riskDescriptions: Record<string, string> = {
    low: 'Conservative — flag ALL deviations from YC/NVCA standard forms, including minor ones. The client wants comprehensive protection and is willing to negotiate aggressively. Include informational notes about terms that could theoretically be improved.',
    medium: 'Balanced — flag material issues that impact deal economics (dilution >2% from standard), control rights, or create legal risk. Skip purely cosmetic issues but catch anything a prudent lawyer would flag in a client memo.',
    high: 'Aggressive — focus only on critical and high-severity issues that could cause severe economic harm, loss of control, or legal liability. The client values speed and is comfortable with standard market terms even if slightly investor-favorable.',
  };

  const userPrompt = `Perform the complete New Matter Opening process for this submitted document. This is the foundation for the entire engagement — be thorough as a real partner would be.

**Requested Document Type:** ${docName}
**Client Risk Tolerance:** ${matter.riskTolerance.toUpperCase()}
${riskDescriptions[matter.riskTolerance]}
**Target Audience:** ${matter.audience === 'founder' ? 'Startup Founder (non-lawyer — all output must be in plain English with clear action items)' : 'Legal Counsel (technical analysis with statutory citations, NVCA/YC standard references, and legal reasoning)'}

**FULL DOCUMENT TEXT (analyze every line):**
${docPreview}

Return your complete intake assessment as JSON:
{
  "detectedDocType": "Full formal name of the document type detected from actual content analysis (e.g., 'Post-Money SAFE with Valuation Cap and Discount', 'Series A Preferred Stock Term Sheet with Participating Preferred')",
  "instrumentClassification": "Precise instrument classification — which standard form is this closest to and what modifications does it contain? E.g., 'Modified YC Post-Money SAFE (2024) with non-standard MFN omission and below-market valuation cap' or 'Custom Term Sheet based on NVCA Model with expanded protective provisions and full ratchet anti-dilution'",
  "jurisdictionConfirmed": "Jurisdiction from governing law clause, or 'Delaware' if not specified (with note that this is assumed)",
  "jurisdictionLocked": true,
  "governingLaw": "Exact governing law clause text quoted from document, or 'Not specified — defaulting to Delaware' if absent",
  "disputeResolution": "Exact dispute resolution mechanism from document (e.g., 'Binding arbitration in San Francisco, CA' or 'Litigation in Delaware Court of Chancery' or 'Not specified')",
  "conflictCheck": {
    "cleared": true (set to false ONLY if an actual conflict is identified — e.g., firm represents both parties),
    "partiesChecked": ["List EVERY party named or referenced in the document — company, investors, officers, counsel, agents"],
    "potentialConflicts": ["Any potential conflict issues identified, or empty array if clear"],
    "waiverRequired": false,
    "notes": "Summary of conflict check process and result. E.g., 'Conflict check cleared. Identified 2 parties: TechCo Inc. (client) and Angel Investor LLC (counterparty). No existing representation of counterparty. No structural conflicts identified.'"
  },
  "engagementScope": {
    "clientName": "Name of the party we are representing (extract from document)",
    "matterDescription": "One-sentence description of the engagement. E.g., 'Review and analysis of SAFE agreement between [Company] and [Investor] for $[Amount] with $[Cap] valuation cap'",
    "scopeOfWork": ["5-8 specific work items that define what we are doing. E.g.: 'Review all material terms against current market standards', 'Identify deviations from YC standard SAFE form', 'Assess economic impact of key terms on founder dilution', 'Prepare redline markup with proposed counter-terms', 'Draft negotiation strategy memorandum', 'Perform adversarial quality review of all analysis', 'Prepare client-ready deliverables package'"],
    "limitations": ["4-6 explicit limitations. E.g.: 'This engagement does not include tax advice or tax structuring analysis', 'No opinion on intellectual property ownership or assignment', 'Analysis assumes no side letters or amendments exist beyond the provided document', 'No background factual investigation of the parties', 'This review does not constitute a fairness opinion', 'No regulatory compliance review (SEC, state blue sky laws)' "],
    "assumptions": ["3-5 assumptions. E.g.: 'Document provided is the current draft being considered for execution', 'No prior agreements between the parties modify the terms of this instrument', 'Company is organized and in good standing in the stated jurisdiction', 'Capitalization table referenced is current and accurate'"],
    "estimatedTimeline": "Realistic timeline based on complexity. E.g., 'Analysis pipeline: ~2-5 minutes. Equivalent human attorney time: 8-12 hours for an associate plus 2-3 hours partner review.'",
    "qualifications": ["2-3 professional qualifications. E.g.: 'AI-generated analysis — must be reviewed by qualified legal counsel before reliance', 'Analysis reflects general market standards as of early 2024; market conditions may have shifted', 'Recommendations are based on document text as provided and publicly available market data'"]
  },
  "allowedScope": ["Array of 10-15 SPECIFIC analysis workstreams. Each should be a precise analysis task: 'Valuation cap benchmarking against current YC standard', 'Discount rate analysis and interaction with cap', 'MFN clause completeness and enforceability', 'Conversion mechanics analysis', 'Liquidation preference waterfall modeling', 'Anti-dilution protection assessment', 'Pro-rata rights threshold analysis', 'Board composition and voting control dynamics', 'Protective provisions scope vs NVCA standard', 'Information rights and reporting obligations', 'Drag-along/tag-along provision analysis', 'Representations and warranties completeness', 'Defined terms consistency and completeness check', 'Cross-reference and internal consistency audit', 'Missing standard provisions identification'"],
  "matterAccepted": true,
  "refusalReason": null,
  "riskProfile": "${matter.riskTolerance} — [2-3 sentences describing the specific analysis approach calibrated to this risk level]",
  "audienceMode": "${matter.audience === 'founder' ? 'Founder Mode: Plain English, action verbs, economic impact quantified, conversational scripts included.' : 'Counsel Mode: Technical analysis, statutory citations, proposed markup language, case law references.'}",
  "documentComplexity": "simple" | "moderate" | "complex",
  "estimatedIssues": estimated number of issues (low=8-15, medium=5-10, high=3-7),
  "keyParties": ["Every party identified in the document with their role"],
  "documentDate": "Date from document or null",
  "investmentAmount": "Investment/purchase amount if stated, or null",
  "urgencyLevel": "routine" | "expedited" | "urgent" (based on document content — e.g., pending signing deadline),
  "preliminaryFlags": ["3-5 immediately visible concerns. E.g.: 'Valuation cap at $8M appears below current pre-seed market median of $10-15M', 'MFN section intentionally left blank — investor has no MFN protection', 'Full ratchet anti-dilution detected — extremely investor-favorable, non-standard', '25% discount rate slightly above standard 20%']"
}`;

  const scopeDecisions = await callLLMJSON<IntakeData>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 3500 }
  );

  return {
    conflictCheck: scopeDecisions.conflictCheck,
    engagementScope: scopeDecisions.engagementScope,
    stages: matter.stages.map((s) =>
      s.id === 'intake' ? { ...s, data: scopeDecisions } : s
    ),
  };
}
