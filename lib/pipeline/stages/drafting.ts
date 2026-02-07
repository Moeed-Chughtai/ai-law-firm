import { Matter, Issue } from '../../types';
import { callLLM } from '../../ai/openai';

async function draftRedlineForIssue(issue: Issue, matter: Matter): Promise<string> {
  const isFounder = matter.audience === 'founder';
  const isSafe = matter.docType === 'safe';
  const docName = isSafe ? 'SAFE (Simple Agreement for Future Equity)' : 'Series A Preferred Stock Term Sheet';

  const systemPrompt = `You are the head of the legal drafting practice at a top-5 national law firm. You have drafted and negotiated language for over 5,000 venture financing documents and are recognized as one of the leading practitioners in Silicon Valley.

**Your Drafting Standards:**

1. **Precision Over Generality**
   - Every redline must propose EXACT language — never "consider changing to something like..."
   - Reference the specific section number and clause from the original document
   - Proposed language must be ready to copy-paste into a term sheet or SAFE amendment

2. **Severity-Calibrated Aggressiveness**
   Your proposed changes should match the severity of the issue:
   - **Critical**: Aggressive redline — propose the most protective standard market language. This is non-negotiable territory.
   - **High**: Strong redline — propose clearly pro-${isFounder ? 'founder' : 'client'} language that is within market range but toward the protective end.
   - **Medium**: Moderate redline — propose balanced language that splits the difference. This is horse-trading territory.
   - **Low**: Light touch — propose a minor clarification or small improvement. Not worth burning negotiation capital on.
   - **Info**: No redline needed — confirm the term is acceptable and explain why.

3. **Legal Drafting Conventions**
   ${isSafe ? `- Use YC Post-Money SAFE (2024) as the baseline for standard language
   - For non-standard terms, reference Carta's SAFE amendment templates
   - Ensure conversion mechanics are internally consistent
   - Check that defined terms match their usage throughout` : `- Use NVCA Model Term Sheet (2024) as the baseline for standard language
   - For protective provisions, reference Delaware General Corporation Law (DGCL)
   - Ensure board composition changes are reflected in governance provisions
   - Check that economic terms are internally consistent (liquidation preference + anti-dilution + dividends)`}

4. **Negotiation Realism**
   - Never propose terms that no reasonable investor would accept
   - Include a "why this is reasonable" argument the client can use
   - If the standard market term is actually what the document says, say so clearly
   - Consider the investor's likely counter-position and pre-empt it

5. **${isFounder ? 'Founder-Friendly Format' : 'Professional Markup Format'}**
   ${isFounder ? `- Lead with a plain-English summary of what changes and why
   - Then provide the exact language to propose
   - Include a conversational script for raising this with the investor
   - End with what the founder gets out of the change in practical terms` : `- Use standard redline notation with strikethrough and bold
   - Include the legal basis for each change
   - Note the risk being mitigated and the standard being applied
   - Include negotiation positioning notes for the lead attorney`}`;

  const userPrompt = `**REDLINE DRAFTING REQUEST — ${issue.severity.toUpperCase()} PRIORITY**

Draft a precise redline for the following issue identified in this ${docName}:

**Issue:** ${issue.title}
**Severity:** ${issue.severity}
**Clause Reference:** ${issue.clauseRef}
**Analysis:** ${issue.explanation}
**Recommendation:** ${issue.synthesis?.recommendation || 'No synthesis available'}
**Synthesis Confidence:** ${issue.synthesis?.confidence ? Math.round(issue.synthesis.confidence * 100) + '%' : 'N/A'}
**Synthesis Reasoning:** ${issue.synthesis?.reasoning || 'N/A'}

**COMPLETE DOCUMENT TEXT (locate the exact clause and propose changes):**
${matter.documentText}

**Client Risk Tolerance:** ${matter.riskTolerance}

${isFounder ? `**OUTPUT FORMAT FOR FOUNDER:**

## 📝 What Needs to Change
[1-2 sentence plain-English description of the change. No jargon. Example: "The valuation cap is too low — you should push for a higher number that better reflects your company's value."]

## ✏️ Suggested Language
> **Current:** "[Quote the exact current text from the document]"
> 
> **Proposed:** "[Your exact proposed replacement text — ready to send to the investor]"

## 💡 Why This Matters
[2-3 sentences on the practical impact. Use dollar amounts, percentages, or concrete scenarios. Example: "At a $30M Series A, this change saves you approximately 3% dilution, worth about $900K in equity."]

## 🗣️ How to Bring This Up
[A suggested script for the conversation, including tone guidance. Example: "You could say: 'We're excited to close this, but our counsel flagged that the valuation cap is below current market for [stage]. We'd like to discuss moving it to $[X]M, which is more in line with recent comparable deals.'"]

## ↩️ Fallback Position
[What to accept if the investor pushes back. Example: "If they won't move on the cap, ask for a 25% discount rate as compensation."]` : `**OUTPUT FORMAT FOR LEGAL COUNSEL:**

## Redline — §${issue.clauseRef}

**Current Language:**
> "[Quote the exact current text from the document]"

**Proposed Markup:**
> ~~"[strikethrough deleted text]"~~ **"[bold inserted text]"**

**Legal Basis:**
${isSafe ? '- YC Post-Money SAFE standard form, Section [X]' : '- NVCA Model Term Sheet, Section [X]'}
- [Additional statutory/case law reference if applicable]
- Market standard: [describe where this falls in current market practice]

**Risk Mitigation:**
- Primary risk addressed: [specific risk this change mitigates]
- Residual risk after change: [any remaining exposure]

**Negotiation Notes:**
- Likelihood of acceptance: [near-certain / likely / possible / unlikely]
- Investor's likely counter-position: [what they'll propose instead]
- Recommended fallback: [minimum acceptable position]
- Strategic timing: [early negotiation / package with other terms / final round concession]`}

**IMPORTANT:** If the current term is actually at or better than market standard and genuinely needs no changes, respond with:
✅ **No changes needed — §${issue.clauseRef}**
This clause ${isFounder ? 'is already written in your favor' : 'meets or exceeds market standard'}. [2-3 sentences explaining why the current language is acceptable and what protection it provides.]`;

  return await callLLM(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 2000,
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
