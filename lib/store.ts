import { Matter } from './types';
import { pool } from './db/client';

// PostgreSQL-based store (replaces in-memory)

export async function getMatter(id: string): Promise<Matter | undefined> {
  const result = await pool.query(
    `SELECT * FROM matters WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    id: row.id,
    createdAt: row.created_at,
    docType: row.doc_type,
    jurisdiction: row.jurisdiction,
    riskTolerance: row.risk_tolerance,
    audience: row.audience,
    documentText: row.document_text,
    fileName: row.file_name,
    status: row.status,
    currentStage: row.current_stage,
    overallConfidence: row.overall_confidence || 0,
    stages: row.stages || [],
    parsedSections: row.parsed_sections || [],
    issues: row.issues || [],
    guardrails: row.guardrails,
    deliverables: row.deliverables || [],
    auditLog: row.audit_log || [],
    adversarialCritiques: row.adversarial_critiques || [],
    draftRevised: row.draft_revised || false,
  };
}

export async function setMatter(matter: Matter): Promise<void> {
  await pool.query(
    `INSERT INTO matters (
      id, created_at, doc_type, jurisdiction, risk_tolerance, audience,
      document_text, file_name, status, current_stage, overall_confidence,
      stages, parsed_sections, issues, guardrails, deliverables,
      audit_log, adversarial_critiques, draft_revised
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      current_stage = EXCLUDED.current_stage,
      overall_confidence = EXCLUDED.overall_confidence,
      stages = EXCLUDED.stages,
      parsed_sections = EXCLUDED.parsed_sections,
      issues = EXCLUDED.issues,
      guardrails = EXCLUDED.guardrails,
      deliverables = EXCLUDED.deliverables,
      audit_log = EXCLUDED.audit_log,
      adversarial_critiques = EXCLUDED.adversarial_critiques,
      draft_revised = EXCLUDED.draft_revised`,
    [
      matter.id,
      matter.createdAt,
      matter.docType,
      matter.jurisdiction,
      matter.riskTolerance,
      matter.audience,
      matter.documentText,
      matter.fileName || null,
      matter.status,
      matter.currentStage || null,
      matter.overallConfidence,
      JSON.stringify(matter.stages),
      JSON.stringify(matter.parsedSections),
      JSON.stringify(matter.issues),
      matter.guardrails ? JSON.stringify(matter.guardrails) : null,
      JSON.stringify(matter.deliverables),
      JSON.stringify(matter.auditLog),
      JSON.stringify(matter.adversarialCritiques || []),
      matter.draftRevised,
    ]
  );
}

export async function updateMatter(
  id: string,
  updates: Partial<Matter>
): Promise<Matter | undefined> {
  const matter = await getMatter(id);
  if (!matter) return undefined;

  const updated = { ...matter, ...updates };
  await setMatter(updated);
  return updated;
}

export async function getAllMatters(): Promise<Matter[]> {
  const result = await pool.query(
    `SELECT * FROM matters ORDER BY created_at DESC`
  );
  
  return result.rows.map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    docType: row.doc_type,
    jurisdiction: row.jurisdiction,
    riskTolerance: row.risk_tolerance,
    audience: row.audience,
    documentText: row.document_text,
    fileName: row.file_name,
    status: row.status,
    currentStage: row.current_stage,
    overallConfidence: row.overall_confidence || 0,
    stages: row.stages || [],
    parsedSections: row.parsed_sections || [],
    issues: row.issues || [],
    guardrails: row.guardrails,
    deliverables: row.deliverables || [],
    auditLog: row.audit_log || [],
    adversarialCritiques: row.adversarial_critiques || [],
    draftRevised: row.draft_revised || false,
  }));
}
