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
}

export async function runIntake(matter: Matter): Promise<Partial<Matter>> {
  const systemPrompt = `You are a legal intake specialist for a startup law firm. Analyze the submitted document and determine if it's a valid SAFE or Term Sheet that can be processed.`;

  const userPrompt = `Analyze this document and provide intake decisions:

Document Type Requested: ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
Risk Tolerance: ${matter.riskTolerance}
Audience: ${matter.audience}

Document Text:
${matter.documentText.substring(0, 2000)}

Provide a JSON response with:
- detectedDocType: Full name of the document type detected
- jurisdictionConfirmed: "Delaware" (always)
- jurisdictionLocked: true
- allowedScope: Array of 6-8 analysis areas appropriate for this document type
- matterAccepted: boolean (true if document appears valid)
- refusalReason: null if accepted, or reason string if rejected
- riskProfile: the risk tolerance level
- audienceMode: Description of how to format output (plain English for founders, technical for lawyers)`;

  const scopeDecisions = await callLLMJSON<IntakeData>(
    systemPrompt,
    userPrompt,
    { temperature: 0.2 }
  );

  return {
    stages: matter.stages.map((s) =>
      s.id === 'intake' ? { ...s, data: scopeDecisions } : s
    ),
  };
}
