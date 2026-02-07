import OpenAI from 'openai';

// Lazy initialization — don't crash at import time
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Add it to .env.local');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 120000, // 2 min for complex legal analysis
    });
  }
  return _openai;
}

// Backward compat proxy
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const real = getOpenAI();
    const value = (real as any)[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

// Performance tracking
interface LLMCallMetrics {
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

const recentMetrics: LLMCallMetrics[] = [];

export function getRecentMetrics(): LLMCallMetrics[] {
  return recentMetrics.slice(-20);
}

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
    maxTokens = 4096,
    responseFormat,
  } = options;

  const start = Date.now();

  try {
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat && { response_format: responseFormat }),
    });

    const latencyMs = Date.now() - start;
    recentMetrics.push({
      model,
      latencyMs,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`OpenAI API error (${model}, ${Date.now() - start}ms):`, error);
    throw error;
  }
}

// Parallel LLM calls with concurrency control
export async function callLLMParallel<T>(
  calls: Array<{
    systemPrompt: string;
    userPrompt: string;
    options?: { model?: string; temperature?: number; maxTokens?: number };
  }>,
  concurrency: number = 5
): Promise<string[]> {
  const results: string[] = new Array(calls.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < calls.length; i++) {
    const { systemPrompt, userPrompt, options } = calls[i];
    const p = callLLM(systemPrompt, userPrompt, options || {}).then((res) => {
      results[i] = res;
    });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove settled promises
      for (let j = executing.length - 1; j >= 0; j--) {
        const settled = await Promise.race([
          executing[j].then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) executing.splice(j, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

// JSON response helper with retry and validation
export async function callLLMJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await callLLM(systemPrompt, userPrompt, {
      ...options,
      responseFormat: { type: 'json_object' },
    });

    try {
      // Clean response — sometimes models add markdown fences
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      if (attempt < maxAttempts - 1) {
        console.warn('JSON parse failed, retrying...', parseError);
        continue;
      }
      console.error('Failed to parse JSON after retries:', response.substring(0, 200));
      throw new Error('Invalid JSON response from LLM');
    }
  }

  throw new Error('Exhausted retry attempts');
}
