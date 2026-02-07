import { Matter, Issue } from '../../types';
import { callLLM } from '../../ai/openai';

export async function runDrafting(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];
  const issuesWithSynthesis = issues.filter((i) => i.synthesis);

  for (let i = 0; i < issuesWithSynthesis.length; i++) {
    const issue = issuesWithSynthesis[i];

    const systemPrompt = `You are a legal drafting specialist. Generate redline suggestions (specific text changes) for legal documents.`;

    const userPrompt = `Generate a redline suggestion for this issue:

Issue: ${issue.title}
Severity: ${issue.severity}
Clause Reference: ${issue.clauseRef}
Recommendation: ${issue.synthesis?.recommendation}

Document Context:
${matter.documentText.substring(0, 2000)}

Audience: ${matter.audience === 'founder' ? 'Founder (plain English explanation)' : 'Lawyer (technical legal redline with citations)'}

Provide a redline that:
${matter.audience === 'founder'
  ? '- Explains the change in plain English\n- Uses simple language\n- Focuses on "what this means for you"'
  : '- Uses legal terminology\n- Includes specific section references\n- Cites relevant standards (YC, NVCA, etc.)\n- Shows exact text to delete (strikethrough) and add (bold)'}

Format:
${matter.audience === 'founder'
  ? '**Suggested Change:** [plain English explanation]\n\n**Why:** [brief reason]'
  : '**Redline § X:** ~~"old text"~~ → **"new text"** — *Basis: [legal basis/citation]*'}

If no changes are needed, say "No changes needed — this clause is standard and appropriate."`;

    try {
      const redline = await callLLM(systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 800,
      });

      const issueIndex = issues.findIndex((iss) => iss.id === issue.id);
      if (issueIndex >= 0) {
        issues[issueIndex] = {
          ...issue,
          redline: redline.trim(),
        };
      }
    } catch (error) {
      console.error(`Drafting failed for issue ${issue.id}:`, error);
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
