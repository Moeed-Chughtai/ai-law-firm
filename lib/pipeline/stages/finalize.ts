import { Matter, Deliverable } from '../../types';
import { generateId } from '../../utils';
import { callLLM } from '../../ai/openai';

export async function runFinalize(matter: Matter): Promise<Partial<Matter>> {
  const now = new Date().toISOString();
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';
  const audienceIsFounder = matter.audience === 'founder';

  const criticalCount = matter.issues.filter(i => i.severity === 'critical').length;
  const highCount = matter.issues.filter(i => i.severity === 'high').length;
  const mediumCount = matter.issues.filter(i => i.severity === 'medium').length;
  const lowCount = matter.issues.filter(i => i.severity === 'low').length;
  const infoCount = matter.issues.filter(i => i.severity === 'info').length;

  const [memo, annotatedDoc, engagementLetter] = await Promise.all([
    callLLM(
      `You are a senior partner at a top-3 Silicon Valley venture law firm, personally drafting the final legal memorandum for a high-value client engagement. This memo will be the primary work product the client relies on for their negotiation strategy.

**Memo Standards:**
- ${audienceIsFounder ? 'Written for a non-lawyer startup founder. Crystal clear, no undefined jargon, every recommendation actionable. Tone: supportive expert advisor, not intimidating lawyer.' : 'Written for experienced legal counsel. Technically precise with statutory references, case law citations where applicable, and formal memo structure.'}
- Every claim must be traceable to the analysis — no generic boilerplate
- Executive summary should be readable in 2 minutes and contain ALL key decisions
- Action items must be numbered, prioritized by the synthesis priority rankings, and include specific deadlines or triggers
- Quality rivaling a $50K engagement letter from a BigLaw firm
- Include cross-references between related issues (interaction effects)
- Reference the engagement scope and confirm all workstreams were covered`,
      `Generate the definitive legal memorandum for this ${docName} review engagement.

**ENGAGEMENT DETAILS:**
- Matter ID: ${matter.id}
- Document Type: ${docName}
- Jurisdiction: ${matter.jurisdiction}
- Risk Tolerance: ${matter.riskTolerance.toUpperCase()}
- Overall Analysis Confidence: ${Math.round((matter.overallConfidence || 0) * 100)}%
- Quality Gate Status: ${matter.guardrails?.escalationRequired ? 'FLAGGED FOR HUMAN REVIEW' : 'Approved for Delivery'}
- Adversarial Review: ${(matter.adversarialCritiques || []).length} critique(s) | Draft Revised: ${matter.draftRevised ? 'Yes' : 'No'} | Revision Loops: ${matter.adversarialLoopCount || 0}
- Conflict Check: ${matter.conflictCheck?.cleared ? 'Cleared' : 'Flagged'}

**ENGAGEMENT SCOPE (confirm coverage):**
${matter.engagementScope?.scopeOfWork?.map(s => `• ${s}`).join('\n') || 'Not defined'}

**ENGAGEMENT LIMITATIONS:**
${matter.engagementScope?.limitations?.map(l => `• ${l}`).join('\n') || 'Not defined'}

**SEVERITY DISTRIBUTION:**
| Severity | Count |
|----------|-------|
| Critical | ${criticalCount} |
| High | ${highCount} |
| Medium | ${mediumCount} |
| Low | ${lowCount} |
| Info | ${infoCount} |

**MISSING PROVISIONS IDENTIFIED:**
${matter.missingProvisions?.map(mp => `• ${mp.provision} [${mp.importance}] — ${mp.explanation}`).join('\n') || 'None'}

**DEFINED TERMS WITH CONCERNS:**
${matter.definedTerms?.filter(dt => dt.concerns).map(dt => `• "${dt.term}" — ${dt.concerns}`).join('\n') || 'All defined terms are standard'}

**COMPLETE ISSUE ANALYSIS (${matter.issues.length} issues):**
${matter.issues
  .sort((a, b) => (a.synthesis?.priorityRank || 99) - (b.synthesis?.priorityRank || 99))
  .map(
    (i, idx) =>
      `### Issue ${idx + 1}: ${i.title} [${i.severity.toUpperCase()}] ${i.category ? `(${i.category})` : ''}
**Clause Reference:** ${i.clauseRef}
**Analysis:** ${i.explanation}
**Standard Form Deviation:** ${i.standardFormDeviation || 'N/A'}
**Cross-Clause Interactions:** ${i.interactionEffects?.join('; ') || 'None'}
**Confidence:** ${i.confidence ? Math.round(i.confidence * 100) + '%' : 'N/A'}
${i.research ? `**Market Intelligence:** ${i.research.marketNorms}
**Risk Impact:** ${i.research.riskImpact}
**Negotiation Strategy:** ${i.research.negotiationLeverage}
**Legal Authority:** ${i.research.precedents || 'N/A'}` : ''}
${i.synthesis ? `**Primary Action:** ${i.synthesis.primaryAction || 'N/A'}
**Fallback Position:** ${i.synthesis.fallbackPosition || 'N/A'}
**Walk-Away Threshold:** ${i.synthesis.walkAwayThreshold || 'N/A'}
**Negotiation Priority:** ${i.synthesis.priorityRank || 'N/A'}/5
**Recommendation:** ${i.synthesis.recommendation}
**Synthesis Confidence:** ${Math.round(i.synthesis.confidence * 100)}%
**Reasoning:** ${i.synthesis.reasoning}` : ''}
${i.redline ? `**Redline Markup:** ${i.redline}` : ''}`
  )
  .join('\n\n---\n\n')}

${matter.adversarialCritiques?.length ? `**ADVERSARIAL REVIEW FINDINGS:**\n${matter.adversarialCritiques.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

**MEMO STRUCTURE (follow this EXACTLY):**

# Legal Analysis Memorandum — ${docName} Review
**Date:** [today's date]
**Prepared for:** ${audienceIsFounder ? '[Founder/CEO]' : '[General Counsel]'}
**Prepared by:** AI Legal Analysis Platform (Reviewed by adversarial QA)
**Confidential — Attorney Work Product**

---

## 1. Executive Summary
[2-3 paragraphs covering: (a) Overall assessment — is this document ${audienceIsFounder ? 'safe to sign' : 'within acceptable parameters'}?, (b) The 2-3 most critical findings that require immediate attention, (c) Overall negotiation strategy recommendation — push back hard / negotiate selectively / sign with minor modifications]

## 2. Engagement Scope Confirmation
[Brief confirmation that all scoped workstreams were analyzed, note any limitations, and list the key assumptions underlying this analysis]

## 3. ${audienceIsFounder ? 'Key Numbers You Need to Know' : 'Economic Impact Summary'}
[Bullet-pointed summary of the key economic figures: dilution impact, valuation implications, worst-case scenarios. ${audienceIsFounder ? 'Use plain dollar amounts and percentages.' : 'Include cap table arithmetic.'}]

## 4. Missing Provisions Alert
[List any standard provisions that are MISSING from the document, ordered by importance. For each, explain what protection is lost and what the standard language would provide.]

## 5. Detailed Analysis by Issue (Priority Order)
[One subsection per issue, ordered by negotiation priority (from synthesis priorityRank). Each subsection includes:
- What the document says (quote the relevant language)
- How it deviates from the standard form
- Why it matters (${audienceIsFounder ? 'in practical/dollar terms' : 'legal analysis with references'})
- Cross-clause interaction effects
- Primary action to take
- Fallback position
- Proposed language change (if applicable)]

## 6. ${audienceIsFounder ? 'Your Negotiation Playbook' : 'Strategic Recommendations'}
[Numbered list of priority actions, organized by negotiation sequence:
1. [CRITICAL — NEGOTIATE FIRST] Items to address BEFORE signing — deal-breakers
2. [HIGH — NEGOTIATE EARLY] Items to raise in initial markup
3. [MEDIUM — PACKAGE DEALS] Items to raise as part of a trade
4. [LOW — LATE ROUND] Items to note but save for final negotiations
5. [ACCEPT] Items that are at or better than market — no action needed]

## 7. Cross-Clause Interaction Map
[Identify all material interactions between clauses and explain how they compound or mitigate each other's effects]

## 8. Quality & Confidence Assessment
[Transparency section: overall confidence score, methodology notes, adversarial review summary (including revision loops if any), guardrail results, any caveats or limitations]

## 9. ${audienceIsFounder ? 'Next Steps' : 'Recommended Action Timeline'}
[Specific, dated action items: what to do this week, what to do before signing, what to confirm with legal counsel]

---
**Important Disclaimer**
This analysis was generated by an AI legal analysis system and does NOT constitute legal advice. ${audienceIsFounder ? 'You should review all recommendations with a qualified attorney before taking action or signing any documents.' : 'This analysis should be reviewed and validated by qualified counsel before reliance.'}${matter.guardrails?.escalationRequired ? '\n\n**This analysis has been flagged for human attorney review.** Specific concerns have been identified that require professional oversight before this analysis should be relied upon.' : ''}`,
      { temperature: 0.3, maxTokens: 8000 }
    ),

    callLLM(
      `You are a legal document annotator at a top law firm. You produce client-ready annotated documents that reproduce the original text with professional inline annotations showing every identified issue, its severity, and the recommended change. Your annotations are clear, visually distinct, and immediately actionable.`,
      `Create a professionally annotated version of this ${docName}. Reproduce the COMPLETE original text with inline annotations for every identified issue.

**ORIGINAL DOCUMENT (reproduce in full):**
${matter.documentText}

**ISSUES TO ANNOTATE (embed these as inline annotations):**
${matter.issues
  .map(
    (i) =>
      `- **§${i.clauseRef}**: ${i.title} [${i.severity.toUpperCase()}]
  Analysis: ${i.explanation}
  ${i.redline ? `Redline: ${i.redline.substring(0, 500)}` : `Recommendation: ${i.synthesis?.recommendation || i.explanation}`}`
  )
  .join('\n')}

**ANNOTATION FORMAT:**

At the top, include:
# Annotated ${docName}
**Severity Legend:**
- **CRITICAL** — Deal-breaker; requires immediate renegotiation
- **HIGH** — Significant risk; should be negotiated
- **MEDIUM** — Notable concern; discuss if possible
- **LOW** — Minor issue; note but likely acceptable
- **INFO** — Educational note; no action required
- **CLEAR** — No issues identified in this section

**Total Issues Found:** ${matter.issues.length} | **Analysis Confidence:** ${Math.round((matter.overallConfidence || 0) * 100)}%

---

Then reproduce each section of the document. After EVERY section (whether it has issues or not), add an annotation block:

For sections WITH issues:
> **[SEVERITY] — [Issue Title]**
> 
> **What This Means:** [1-2 sentence ${audienceIsFounder ? 'plain-English' : 'technical'} explanation]
> 
> **Recommended Change:** [Specific proposed change or "No change needed"]
> 
> **Impact:** [Economic or legal impact in concrete terms]

For sections WITHOUT issues:
> **No issues identified** — This section is at or better than market standard.

Make sure EVERY section of the document gets an annotation (either an issue or a clean bill of health).`,
      { temperature: 0.2, maxTokens: 5000 }
    ),

    callLLM(
      `You are a managing partner at a top-tier law firm drafting a formal engagement letter that documents the scope, limitations, and terms of this legal review engagement. This is a standard law firm practice — every engagement begins and ends with clear documentation of what was done and what was not done.`,
      `Generate a professional engagement letter for this ${docName} review.

**ENGAGEMENT DETAILS:**
- Client: ${matter.engagementScope?.clientName || 'Client'}
- Matter: ${matter.engagementScope?.matterDescription || `Review of ${docName}`}
- Document Type: ${docName}
- Jurisdiction: ${matter.jurisdiction}
- Date: ${new Date().toISOString().split('T')[0]}

**SCOPE OF WORK PERFORMED:**
${matter.engagementScope?.scopeOfWork?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'General document review and analysis'}

**LIMITATIONS:**
${matter.engagementScope?.limitations?.map((l, i) => `${i + 1}. ${l}`).join('\n') || 'Standard limitations apply'}

**ASSUMPTIONS:**
${matter.engagementScope?.assumptions?.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Standard assumptions apply'}

**QUALIFICATIONS:**
${matter.engagementScope?.qualifications?.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'Standard qualifications apply'}

**CONFLICT CHECK:**
${matter.conflictCheck?.cleared ? `Cleared — ${matter.conflictCheck.notes}` : `Flagged — ${matter.conflictCheck?.notes || 'Review required'}`}
Parties checked: ${matter.conflictCheck?.partiesChecked?.join(', ') || 'N/A'}

**RESULTS SUMMARY:**
- Issues identified: ${matter.issues.length}
- Critical/High severity: ${criticalCount + highCount}
- Overall confidence: ${Math.round((matter.overallConfidence || 0) * 100)}%
- Guardrail status: ${matter.guardrails?.escalationRequired ? 'Escalated for human review' : 'Passed all quality gates'}
- Adversarial review loops: ${matter.adversarialLoopCount || 0}

**FORMAT:**

# Engagement Letter — ${docName} Review
**Date:** ${new Date().toISOString().split('T')[0]}
**Re:** ${matter.engagementScope?.matterDescription || `Review of ${docName}`}

Dear ${audienceIsFounder ? 'Founder' : 'Counsel'},

[Opening paragraph confirming the engagement and summarizing what was done]

## Scope of Engagement
[Numbered list of specific work performed]

## Limitations of Engagement
[Clear, specific list of what this engagement did NOT cover — this is legally critical for managing expectations and limiting liability]

## Key Assumptions
[List all assumptions that the analysis was based on]

## Summary of Findings
[Brief 2-3 paragraph summary of results: how many issues found, overall risk level, key action items]

## Quality Assurance
[Description of the multi-stage QA process: adversarial review, guardrails, confidence calibration]

## Important Disclaimers
- This analysis was generated by an AI legal analysis system
- This does NOT constitute legal advice and should not be relied upon as such
- All recommendations should be reviewed by qualified legal counsel before action
- The analysis is based on the document as provided; changes to the document require re-analysis
${matter.guardrails?.escalationRequired ? '- This analysis has been flagged for mandatory human attorney review before reliance' : ''}

## Professional Qualifications
${matter.engagementScope?.qualifications?.map(q => `- ${q}`).join('\n') || '- AI-generated analysis — must be reviewed by qualified legal counsel'}

---
**AI Legal Analysis Platform**
*Confidential — Attorney Work Product Equivalent*`,
      { temperature: 0.2, maxTokens: 3000 }
    ),
  ]);

  const riskSummary = JSON.stringify(
    {
      matterId: matter.id,
      generatedAt: now,
      documentMetadata: {
        docType: matter.docType,
        jurisdiction: matter.jurisdiction,
        riskTolerance: matter.riskTolerance,
        audience: matter.audience,
      },
      engagementScope: {
        clientName: matter.engagementScope?.clientName || null,
        scopeOfWork: matter.engagementScope?.scopeOfWork || [],
        limitations: matter.engagementScope?.limitations || [],
        assumptions: matter.engagementScope?.assumptions || [],
      },
      conflictCheck: {
        cleared: matter.conflictCheck?.cleared || false,
        partiesChecked: matter.conflictCheck?.partiesChecked || [],
        notes: matter.conflictCheck?.notes || null,
      },
      qualityMetrics: {
        overallConfidence: matter.overallConfidence,
        guardrailStatus: matter.guardrails?.escalationRequired ? 'escalated' : 'passed',
        adversarialReview: {
          critiquesCount: (matter.adversarialCritiques || []).length,
          draftRevised: matter.draftRevised,
          loopCount: matter.adversarialLoopCount || 0,
        },
        pipelineStages: matter.stages.map(s => ({
          id: s.id,
          status: s.status,
        })),
      },
      documentStructure: {
        sections: matter.parsedSections?.length || 0,
        definedTerms: matter.definedTerms?.length || 0,
        nonStandardTerms: matter.definedTerms?.filter(dt => !dt.isStandard).length || 0,
        missingProvisions: matter.missingProvisions?.length || 0,
        criticalMissingProvisions: matter.missingProvisions?.filter(mp => mp.importance === 'critical').length || 0,
      },
      severityDistribution: {
        total: matter.issues.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        info: infoCount,
      },
      issues: matter.issues.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        category: i.category || null,
        clauseRef: i.clauseRef,
        initialConfidence: i.confidence,
        synthesisConfidence: i.synthesis?.confidence || null,
        primaryAction: i.synthesis?.primaryAction || null,
        fallbackPosition: i.synthesis?.fallbackPosition || null,
        priorityRank: i.synthesis?.priorityRank || null,
        recommendation: i.synthesis?.recommendation || null,
        reasoning: i.synthesis?.reasoning || null,
        interactionEffects: i.interactionEffects || [],
        statutoryBasis: i.statutoryBasis || null,
        standardFormDeviation: i.standardFormDeviation || null,
        hasRedline: !!i.redline,
        hasResearch: !!i.research,
        hasPrecedents: !!i.research?.precedents,
        redlinePreview: i.redline ? i.redline.substring(0, 200) : null,
      })),
      guardrailResults: {
        jurisdictionCheck: matter.guardrails?.jurisdictionCheck || 'not_run',
        citationCompleteness: matter.guardrails?.citationCompleteness || 'not_run',
        confidenceThreshold: matter.guardrails?.confidenceThreshold || null,
        escalationRequired: matter.guardrails?.escalationRequired || false,
        escalationReason: matter.guardrails?.escalationReason || null,
      },
      adversarialFindings: (matter.adversarialCritiques || []),
    },
    null,
    2
  );

  const stageTimings = matter.auditLog
    .filter(e => e.action === 'stage_start' || e.action === 'stage_complete')
    .reduce<Record<string, { start?: string; end?: string }>>((acc, e) => {
      const stage = e.stage;
      if (!acc[stage]) acc[stage] = {};
      if (e.action === 'stage_start') acc[stage].start = e.timestamp;
      if (e.action === 'stage_complete') acc[stage].end = e.timestamp;
      return acc;
    }, {});

  const auditLog = `# Audit Log — Matter ${matter.id}
**Generated:** ${now}
**Document Type:** ${docName}
**Jurisdiction:** ${matter.jurisdiction}
**Risk Tolerance:** ${matter.riskTolerance}
**Audience:** ${matter.audience}

---

## Pipeline Execution Timeline

| # | Stage | Status | Timestamp | Detail |
|---|-------|--------|-----------|--------|
${matter.auditLog.map((e, idx) => `| ${idx + 1} | ${e.stage} | ${e.action} | ${new Date(e.timestamp).toLocaleTimeString()} | ${e.detail} |`).join('\n')}

## Quality Assurance Summary

| Metric | Value | Status |
|--------|-------|--------|
| Overall Confidence | ${Math.round((matter.overallConfidence || 0) * 100)}% | ${(matter.overallConfidence || 0) >= 0.8 ? 'OK' : 'Review'} |
| Issues Analyzed | ${matter.issues.length} | ${matter.issues.length > 0 ? 'OK' : 'Review'} |
| Issues with Research | ${matter.issues.filter(i => i.research).length}/${matter.issues.length} | ${matter.issues.filter(i => i.research).length === matter.issues.length ? 'OK' : 'Review'} |
| Issues with Synthesis | ${matter.issues.filter(i => i.synthesis).length}/${matter.issues.length} | ${matter.issues.filter(i => i.synthesis).length === matter.issues.length ? 'OK' : 'Review'} |
| Issues with Redlines | ${matter.issues.filter(i => i.redline).length}/${matter.issues.length} | — |
| Adversarial Critiques | ${(matter.adversarialCritiques || []).length} | — |
| Draft Revised | ${matter.draftRevised ? 'Yes' : 'No'} | ${matter.draftRevised ? 'Review' : 'OK'} |
| Adversarial Loop Count | ${matter.adversarialLoopCount || 0} | ${(matter.adversarialLoopCount || 0) > 0 ? 'Review' : 'OK'} |
| Conflict Check | ${matter.conflictCheck?.cleared ? 'Cleared' : 'Flagged'} | ${matter.conflictCheck?.cleared ? 'OK' : 'Review'} |
| Jurisdiction Check | ${matter.guardrails?.jurisdictionCheck || 'N/A'} | ${matter.guardrails?.jurisdictionCheck === 'pass' ? 'OK' : 'Review'} |
| Citation Completeness | ${matter.guardrails?.citationCompleteness || 'N/A'} | ${matter.guardrails?.citationCompleteness === 'pass' ? 'OK' : 'Review'} |
| Escalation Required | ${matter.guardrails?.escalationRequired ? 'Yes' : 'No'} | ${matter.guardrails?.escalationRequired ? 'Review' : 'OK'} |

## Stages Completed
${matter.stages.filter((s) => s.status === 'complete' || s.status === 'warning').length}/${matter.stages.length} stages completed successfully

## Disclaimer
This audit log documents the automated legal analysis pipeline execution. All analysis was performed by AI and should be reviewed by qualified legal counsel before reliance.
`;

  const deliverables: Deliverable[] = [
    {
      id: generateId(),
      name: 'Engagement Letter',
      description:
        'Formal engagement letter documenting the scope of work, limitations, assumptions, conflict check results, and professional disclaimers — standard law firm practice for every engagement.',
      format: 'Markdown',
      size: `${(engagementLetter.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: engagementLetter,
    },
    {
      id: generateId(),
      name: 'Issue Memorandum',
      description:
        'Comprehensive legal analysis memorandum with executive summary, detailed issue-by-issue analysis, negotiation playbook, cross-clause interaction map, and prioritized action items.',
      format: 'Markdown',
      size: `${(memo.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: memo,
    },
    {
      id: generateId(),
      name: 'Annotated Document',
      description:
        'Complete original document reproduced with professional inline annotations showing severity-coded issues, recommendations, and clean-bill confirmations for every section.',
      format: 'Markdown',
      size: `${(annotatedDoc.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: annotatedDoc,
    },
    {
      id: generateId(),
      name: 'Risk Summary',
      description:
        'Structured risk assessment data with severity distribution, confidence scores, guardrail results, and issue-level metadata for programmatic consumption.',
      format: 'JSON',
      size: `${(riskSummary.length / 1024).toFixed(1)} KB`,
      timestamp: now,
      content: riskSummary,
    },
    {
      id: generateId(),
      name: 'Audit Log',
      description:
        'Complete pipeline execution trace with stage timings, quality metrics, and compliance documentation.',
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
