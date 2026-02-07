import { Matter, Issue } from '../../types';
import { callLLM } from '../../ai/openai';

async function draftRedlineForIssue(issue: Issue, matter: Matter): Promise<string> {
  const isFounder = matter.audience === 'founder';
  const isSafe = matter.docType === 'safe';

  const systemPrompt = `You are an elite legal drafting specialist at a top venture law firm. You produce precise, actionable redline suggestions that ${isFounder ? 'founders can understand and present to investors' : 'legal counsel can incorporate directly into markup'}.

Your redlines must be:
- **Specific**: Reference exact sections and propose exact language
- **Practical**: Reflect real negotiation dynamics (don't ask for terms investors will never agree to)
- **Calibrated**: Match the severity of the issue to the aggressiveness of the change
- **${isFounder ? 'Clear': 'Technical'}**: ${isFounder ? 'Explain what the change does in plain English a non-lawyer can understand' : 'Use proper legal drafting conventions with track-change formatting'}`;

  const userPrompt = `Generate a redline suggestion for this issue:

**Issue:** ${issue.title} (${issue.severity})
**Clause Reference:** ${issue.clauseRef}
**Analysis:** ${issue.explanation}
**Recommendation:** ${issue.synthesis?.recommendation || 'No synthesis available'}
**Confidence:** ${issue.synthesis?.confidence ? Math.round(issue.synthesis.confidence * 100) + '%' : 'N/A'}

**Document Type:** ${isSafe ? 'SAFE' : 'Term Sheet'}
**Relevant Document Text:**
${matter.documentText}

${isFounder ? `Format for FOUNDER audience:
**What to Change:** [Clear description of the change in plain English]

**Suggested Language:** [The actual text to propose — keep it simple]

**What This Gets You:** [1-2 sentences on the practical benefit]

**How to Bring It Up:** [1 sentence on how to frame this with the investor]` : `Format for LAWYER audience:
**Redline § ${issue.clauseRef}:**
~~"exact current text from document"~~ → **"proposed replacement text"**

*Legal Basis: [NVCA/YC standard, market practice, or statutory reference]*
*Risk Mitigation: [What risk this change addresses]*
*Negotiation Note: [Likelihood of acceptance and fallback position]*`}

If the current term is actually market standard and no change is needed, respond with:
"✅ **No changes needed** — This clause is at or better than market standard. [Brief explanation of why it's acceptable.]"`;

  return await callLLM(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 1200,
  });
}

export async function runDrafting(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];
  const issuesWithSynthesis = issues.filter((i) => i.synthesis);

  // Draft redlines in parallel batches of 4
  const BATCH_SIZE = 4;
  for (let batchStart = 0; batchStart < issuesWithSynthesis.length; batchStart += BATCH_SIZE) {
    const batch = issuesWithSynthesis.slice(batchStart, batchStart + BATCH_SIZE);

    const redlines = await Promise.all(
      batch.map((issue) =>
        draftRedlineForIssue(issue, matter).catch((error) => {
          console.error(`Drafting failed for issue ${issue.id}:`, error);
          return `⚠️ Redline generation failed — please review this issue manually.`;
        })
      )
    );

    // Apply redlines to issues
    for (let i = 0; i < batch.length; i++) {
      const issueIndex = issues.findIndex((iss) => iss.id === batch[i].id);
      if (issueIndex >= 0) {
        issues[issueIndex] = {
          ...batch[i],
          redline: redlines[i].trim(),
        };
      }
    }
  }

  return {
    issues,
    stages: matter.stages.map((s) =>
      s.id === 'drafting'
        ? {
            ...s,
            data: {
              audience: matter.audience,
              totalRedlines: issues.filter(
                (i) => i.redline && !i.redline.includes('No changes needed')
              ).length,
              issues,
            },
          }
        : s
    ),
  };
}
