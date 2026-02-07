import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  } = {}
): Promise<string> {
  const {
    model = 'gpt-4o',
    temperature = 0.3,
    maxTokens = 2000,
    responseFormat,
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat && { response_format: responseFormat }),
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Helper for JSON responses
export async function callLLMJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const response = await callLLM(systemPrompt, userPrompt, {
    ...options,
    responseFormat: { type: 'json_object' },
  });

  try {
    return JSON.parse(response) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from LLM');
  }
}
