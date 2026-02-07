import { Matter, Issue } from '../../types';
import { getMatter, setMatter } from '../../store';
import { callLLMJSON } from '../../ai/openai';

interface SynthesisResult {
  recommendation: string;
  confidence: number;
  reasoning: string;
}

export async function runSynthesis(matter: Matter): Promise<Partial<Matter>> {
  const issues = [...matter.issues];
  let overallConfidence = 0;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    if (!issue.research) continue;

    const systemPrompt = `You are a senior legal partner synthesizing research and forming final recommendations. Your job is to provide clear, actionable legal judgment based on comprehensive research.`;

    const userPrompt = `Synthesize research and form a recommendation for this issue:

Issue: ${issue.title}
Severity: ${issue.severity}
Clause: ${issue.clauseRef}
Explanation: ${issue.explanation}

Research:
- Market Norms: ${issue.research.marketNorms}
- Risk Impact: ${issue.research.riskImpact}
- Negotiation Leverage: ${issue.research.negotiationLeverage}

Risk Tolerance: ${matter.riskTolerance}
Audience: ${matter.audience === 'founder' ? 'Founder (plain English, actionable)' : 'Lawyer (technical legal analysis)'}

Provide:
1. A clear recommendation (what should the founder do?)
2. Confidence score (0.0-1.0) based on how certain you are given the research
3. Reasoning explaining why this matters

Return JSON:
{
  "recommendation": "Clear, actionable recommendation tailored to ${matter.audience === 'founder' ? 'plain English' : 'technical legal'} format",
  "confidence": 0.85,
  "reasoning": "Why this issue matters and what the practical impact is (2-3 sentences)"
}`;

    try {
      const result = await callLLMJSON<SynthesisResult>(
        systemPrompt,
        userPrompt,
        { temperature: 0.3, maxTokens: 1000 }
      );

      issues[i] = {
        ...issue,
        synthesis: result,
      };

      // Update incrementally
      const current = await getMatter(matter.id);
      if (current) {
        current.issues = [...issues];
        const completedSynth = issues.filter((iss) => iss.synthesis).length;
        overallConfidence =
          issues
            .filter((iss) => iss.synthesis)
            .reduce((sum, iss) => sum + (iss.synthesis?.confidence || 0), 0) /
          completedSynth;

        current.overallConfidence = overallConfidence;
        current.stages = current.stages.map((s) =>
          s.id === 'synthesis'
            ? {
                ...s,
                data: {
                  synthesized: completedSynth,
                  total: issues.length,
                  overallConfidence,
                  issues: current.issues,
                },
              }
            : s
        );
        await setMatter(current);
      }
    } catch (error) {
      console.error(`Synthesis failed for issue ${issue.id}:`, error);
    }
  }

  return {
    issues,
    overallConfidence,
  };
}
