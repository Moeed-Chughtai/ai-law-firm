import { Matter, Deliverable } from '../../types';
import { generateId } from '../../utils';
import { callLLM } from '../../ai/openai';

export async function runFinalize(matter: Matter): Promise<Partial<Matter>> {
  const now = new Date().toISOString();

  // Generate Issue Memorandum
  const memoPrompt = `Generate a comprehensive legal issue memorandum for this ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'} review.

Document Type: ${matter.docType === 'safe' ? 'SAFE' : 'Term Sheet'}
Jurisdiction: ${matter.jurisdiction}
Risk Tolerance: ${matter.riskTolerance}
Overall Confidence: ${Math.round((matter.overallConfidence || 0) * 100)}%

Issues:
${matter.issues
  .map(
    (i) =>
      `- ${i.title} (${i.severity}): ${i.explanation}\n  Recommendation: ${i.synthesis?.recommendation || 'N/A'}\n  Confidence: ${Math.round((i.synthesis?.confidence || 0) * 100)}%`
  )
  .join('\n\n')}

Format as a professional legal memorandum with:
- Executive Summary
- Detailed analysis per issue
- Recommendations
- Guardrail assessment
- Standard legal disclaimers`;

  const memo = await callLLM(
    'You are a legal document generator creating professional legal memoranda.',
    memoPrompt,
    { temperature: 0.3, maxTokens: 4000 }
  );

  // Generate Risk Summary (JSON)
  const riskSummary = JSON.stringify(
    {
      matterId: matter.id,
      docType: matter.docType,
      jurisdiction: matter.jurisdiction,
      riskTolerance: matter.riskTolerance,
      overallConfidence: matter.overallConfidence,
      issuesSummary: {
        total: matter.issues.length,
        critical: matter.issues.filter((i) => i.severity === 'critical').length,
        high: matter.issues.filter((i) => i.severity === 'high').length,
        medium: matter.issues.filter((i) => i.severity === 'medium').length,
        low: matter.issues.filter((i) => i.severity === 'low').length,
        info: matter.issues.filter((i) => i.severity === 'info').length,
      },
      guardrails: matter.guardrails,
      generatedAt: now,
    },
    null,
    2
  );

  // Generate Audit Log
  const auditLog = `# Audit Log — Matter ${matter.id}\n\nGenerated: ${now}\n\n| Timestamp | Stage | Action | Detail |\n|-----------|-------|--------|--------|\n${matter.auditLog.map((e) => `| ${e.timestamp} | ${e.stage} | ${e.action} | ${e.detail} |`).join('\n')}`;

  const deliverables: Deliverable[] = [
    {
      id: generateId(),
      name: 'Issue Memorandum',
      description:
        'Comprehensive legal analysis with findings, recommendations, and redlines for each identified issue.',
      format: 'Markdown',
      size: `${(memo.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: memo,
    },
    {
      id: generateId(),
      name: 'Annotated Document',
      description:
        'Original document with inline annotations showing all suggested changes and their legal basis.',
      format: 'Markdown',
      size: `${((memo.length * 0.8) / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: memo, // In production, this would be the actual annotated document
    },
    {
      id: generateId(),
      name: 'Risk Summary',
      description:
        'Structured risk assessment data including severity distribution and confidence scores.',
      format: 'JSON',
      size: `${(riskSummary.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: riskSummary,
    },
    {
      id: generateId(),
      name: 'Audit Log',
      description:
        'Complete pipeline execution log with timestamps, actions, and stage transitions.',
      format: 'Markdown',
      size: `${(auditLog.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: auditLog,
    },
  ];

  return {
    deliverables,
    stages: matter.stages.map((s) =>
      s.id === 'deliverables' ? { ...s, data: { deliverables } } : s
    ),
  };
}
