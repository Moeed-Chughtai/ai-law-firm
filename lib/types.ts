export type StageId =
  | 'intake'
  | 'parsing'
  | 'issue_analysis'
  | 'research'
  | 'synthesis'
  | 'drafting'
  | 'adversarial_review'
  | 'guardrails'
  | 'deliverables';

export type StageStatus = 'pending' | 'running' | 'complete' | 'warning' | 'blocked';

export type RiskTolerance = 'low' | 'medium' | 'high';
export type Audience = 'founder' | 'lawyer';
export type DocType = 'safe' | 'term_sheet';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface StageInfo {
  id: StageId;
  label: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  data?: any;
}

export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  clauseRef: string;
  explanation: string;
  recommendation?: string;
  confidence?: number;
  research?: {
    marketNorms: string;
    riskImpact: string;
    negotiationLeverage: string;
  };
  synthesis?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
  };
  redline?: string;
}

export interface ParsedSection {
  heading: string;
  clauseCount: number;
  content: string;
}

export interface GuardrailResult {
  jurisdictionCheck: 'pass' | 'fail';
  citationCompleteness: 'pass' | 'warning' | 'fail';
  confidenceThreshold: { score: number; required: number; pass: boolean };
  escalationRequired: boolean;
  escalationReason?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  format: string;
  size: string;
  timestamp: string;
  content: string;
}

export interface AuditEntry {
  timestamp: string;
  stage: StageId;
  action: string;
  detail: string;
}

export interface Matter {
  id: string;
  createdAt: string;
  docType: DocType;
  jurisdiction: string;
  riskTolerance: RiskTolerance;
  audience: Audience;
  documentText: string;
  fileName?: string;

  // Pipeline state
  stages: StageInfo[];
  currentStage: StageId | null;
  overallConfidence: number;

  // Stage outputs
  parsedSections: ParsedSection[];
  issues: Issue[];
  guardrails: GuardrailResult | null;
  deliverables: Deliverable[];
  auditLog: AuditEntry[];

  // Adversarial review
  adversarialCritiques: string[];
  draftRevised: boolean;

  // Final status
  status: 'processing' | 'complete' | 'error';
}

export interface CreateMatterRequest {
  docType: DocType;
  riskTolerance: RiskTolerance;
  audience: Audience;
  documentText: string;
  fileName?: string;
}
