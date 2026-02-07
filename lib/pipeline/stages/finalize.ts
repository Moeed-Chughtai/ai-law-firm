import { Matter, Deliverable } from '../../types';
import { generateId } from '../../utils';
import { callLLM } from '../../ai/openai';

export async function runFinalize(matter: Matter): Promise<Partial<Matter>> {
  const now = new Date().toISOString();
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE' : 'Term Sheet';

  // Generate all deliverables in parallel for speed
  const [memo, annotatedDoc] = await Promise.all([
    // 1. Issue Memorandum
    callLLM(
      `You are a senior legal associate producing a professional legal memorandum. Write in ${matter.audience === 'founder' ? 'clear, accessible language suitable for a non-lawyer startup founder' : 'formal legal memo style with proper citations and analysis structure'}.`,
      `Generate a comprehensive legal memorandum for this ${docName} review.

**Matter ID:** ${matter.id}
**Document Type:** ${docName}
**Jurisdiction:** ${matter.jurisdiction}
**Risk Tolerance:** ${matter.riskTolerance}
**Overall Confidence:** ${Math.round((matter.overallConfidence || 0) * 100)}%
**Guardrail Status:** ${matter.guardrails?.escalationRequired ? 'NEEDS HUMAN REVIEW' : 'Approved'}

**Issues Analyzed (${matter.issues.length} total):**
${matter.issues
  .map(
    (i, idx) =>
      `${idx + 1}. **${i.title}** (${i.severity.toUpperCase()})
   Clause: ${i.clauseRef}
   Analysis: ${i.explanation}
   ${i.synthesis ? `Recommendation: ${i.synthesis.recommendation}\n   Confidence: ${Math.round(i.synthesis.confidence * 100)}%\n   Reasoning: ${i.synthesis.reasoning}` : ''}
   ${i.redline ? `Redline: ${i.redline}` : ''}`
  )
  .join('\n\n')}

${matter.adversarialCritiques?.length ? `**Adversarial Review Notes:**\n${matter.adversarialCritiques.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

Format as a professional legal memorandum with:
- **Executive Summary** (2-3 paragraphs: key findings, overall assessment, immediate action items)
- **Detailed Analysis** (one section per issue with full analysis, recommendation, and redline)
- **Priority Action Items** (numbered list of what to do first)
- **Risk Assessment Summary** (severity distribution, confidence levels)
- **Guardrail Assessment** (quality checks performed)
- **Disclaimer** (standard AI legal analysis disclaimer)`,
      { temperature: 0.3, maxTokens: 4096 }
    ),

    // 2. Annotated Document
    callLLM(
      `You are a legal document annotator. Produce the original document with inline annotations showing all suggested changes, their severity, and legal basis.`,
      `Create an annotated version of this ${docName}. Reproduce the original text and add inline annotations for each identified issue.

**Original Document:**
${matter.documentText}

**Issues to Annotate:**
${matter.issues
  .map(
    (i) =>
      `- ${i.clauseRef}: ${i.title} (${i.severity}) — ${i.redline || i.synthesis?.recommendation || i.explanation}`
  )
  .join('\n')}

Format: Reproduce each section of the document. After each section that has an issue, add an annotation block like:
> **⚠️ [SEVERITY] — [Issue Title]**
> [Brief explanation and recommended change]

If a section has no issues, add:
> ✅ No issues identified

Include a legend at the top explaining severity levels.`,
      { temperature: 0.2, maxTokens: 4096 }
    ),
  ]);

  // 3. Risk Summary (structured JSON — no LLM needed)
  const riskSummary = JSON.stringify(
    {
      matterId: matter.id,
      generatedAt: now,
      docType: matter.docType,
      jurisdiction: matter.jurisdiction,
      riskTolerance: matter.riskTolerance,
      overallConfidence: matter.overallConfidence,
      guardrails: matter.guardrails,
      issuesSummary: {
        total: matter.issues.length,
        critical: matter.issues.filter((i) => i.severity === 'critical').length,
        high: matter.issues.filter((i) => i.severity === 'high').length,
        medium: matter.issues.filter((i) => i.severity === 'medium').length,
        low: matter.issues.filter((i) => i.severity === 'low').length,
        info: matter.issues.filter((i) => i.severity === 'info').length,
      },
      issues: matter.issues.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        clauseRef: i.clauseRef,
        confidence: i.synthesis?.confidence || null,
        recommendation: i.synthesis?.recommendation || null,
        hasRedline: !!i.redline,
      })),
      adversarialReview: {
        critiquesCount: (matter.adversarialCritiques || []).length,
        draftRevised: matter.draftRevised,
      },
    },
    null,
    2
  );

  // 4. Audit Log
  const auditLog = `# Audit Log — Matter ${matter.id}
Generated: ${now}
Document Type: ${docName}
Jurisdiction: ${matter.jurisdiction}

## Pipeline Execution Timeline

| Timestamp | Stage | Action | Detail |
|-----------|-------|--------|--------|
${matter.auditLog.map((e) => `| ${new Date(e.timestamp).toLocaleTimeString()} | ${e.stage} | ${e.action} | ${e.detail} |`).join('\n')}

## Quality Metrics
- Overall Confidence: ${Math.round((matter.overallConfidence || 0) * 100)}%
- Issues Analyzed: ${matter.issues.length}
- Stages Completed: ${matter.stages.filter((s) => s.status === 'complete' || s.status === 'warning').length}/${matter.stages.length}
- Guardrail Status: ${matter.guardrails?.escalationRequired ? 'Escalation Required' : 'Passed'}
`;

  const deliverables: Deliverable[] = [
    {
      id: generateId(),
      name: 'Issue Memorandum',
      description:
        'Comprehensive legal analysis with executive summary, detailed findings, recommendations, and redlines for each identified issue.',
      format: 'Markdown',
      size: `${(memo.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: memo,
    },
    {
      id: generateId(),
      name: 'Annotated Document',
      description:
        'Original document with inline annotations showing all identified issues, severity ratings, and suggested changes.',
      format: 'Markdown',
      size: `${(annotatedDoc.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: annotatedDoc,
    },
    {
      id: generateId(),
      name: 'Risk Summary',
      description:
        'Structured risk assessment data including severity distribution, confidence scores, and guardrail results.',
      format: 'JSON',
      size: `${(riskSummary.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: riskSummary,
    },
    {
      id: generateId(),
      name: 'Audit Log',
      description:
        'Complete pipeline execution log with timestamps, stage durations, and quality metrics.',
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
