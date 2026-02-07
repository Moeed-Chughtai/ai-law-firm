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
  category?: IssueCategory;
  interactionEffects?: string[];
  statutoryBasis?: string;
  standardFormDeviation?: string;
  research?: {
    marketNorms: string;
    riskImpact: string;
    negotiationLeverage: string;
    precedents?: string;
  };
  synthesis?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    primaryAction: string;
    fallbackPosition: string;
    walkAwayThreshold?: string;
    priorityRank?: number;
  };
  redline?: string;
}

export type IssueCategory =
  | 'economics'
  | 'control'
  | 'governance'
  | 'protective_provisions'
  | 'information_rights'
  | 'transfer_restrictions'
  | 'exit_mechanisms'
  | 'representations'
  | 'missing_provision'
  | 'definitional'
  | 'procedural'
  | 'other';

export interface DefinedTerm {
  term: string;
  definition: string;
  section: string;
  crossReferences: string[];
  isStandard: boolean;
  concerns?: string;
}

export interface ParsedSection {
  heading: string;
  clauseCount: number;
  content: string;
  operativeVerbs?: string[];
  crossReferences?: string[];
  blankFields?: string[];
  deviationFromStandard?: string;
}

export interface MissingProvision {
  provision: string;
  importance: 'critical' | 'high' | 'medium' | 'low' | 'important' | 'recommended' | 'optional';
  explanation: string;
  standardLanguage?: string;
}

export interface ConflictCheck {
  cleared: boolean;
  partiesChecked: string[];
  potentialConflicts: string[];
  waiverRequired: boolean;
  notes: string;
}

export interface EngagementScope {
  clientName: string;
  matterDescription: string;
  scopeOfWork: string[];
  limitations: string[];
  assumptions: string[];
  estimatedTimeline: string;
  qualifications: string[];
}

export interface GuardrailResult {
  jurisdictionCheck: 'pass' | 'fail';
  citationCompleteness: 'pass' | 'warning' | 'fail';
  confidenceThreshold: { score: number; required: number; pass: boolean };
  escalationRequired: boolean;
  escalationReason?: string;
  hallucinationCheck?: 'pass' | 'warning' | 'fail';
  scopeComplianceCheck?: 'pass' | 'warning' | 'fail';
  ethicsCheck?: 'pass' | 'warning' | 'fail';
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

  // Intake outputs
  conflictCheck?: ConflictCheck;
  engagementScope?: EngagementScope;

  // Parsing outputs
  parsedSections: ParsedSection[];
  definedTerms?: DefinedTerm[];
  missingProvisions?: MissingProvision[];

  // Analysis outputs
  issues: Issue[];
  guardrails: GuardrailResult | null;
  deliverables: Deliverable[];
  auditLog: AuditEntry[];

  // Adversarial review
  adversarialCritiques: string[];
  draftRevised: boolean;
  adversarialLoopCount: number;

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
