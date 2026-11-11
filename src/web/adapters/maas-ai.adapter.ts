import { Logger } from '@nestjs/common';
import { AiUnavailableError } from '../../business/domain/errors/errors.js';
import { CATEGORIES } from '../../business/domain/values/enums.js';
import type { AiPort, SearchIntent, VideoText } from '../../business/ports/ai.port.js';
import { RateBudget } from './rate-budget.js';

const REQUEST_TIMEOUT_MS = 8_000;

const SEARCH_PROMPT = [
  'You turn a search for short Nigerian social-media video clips into search keywords.',
  `Categories: ${CATEGORIES.join(', ')}.`,
  'Reply with JSON only: {"keywords": [3 to 8 lowercase words or short phrases], "category": one category or null}.',
].join('\n');

const VIDEO_PROMPT = [
  'You write extra search keywords for a short Nigerian social-media video clip so people can find it.',
  'Include synonyms, Nigerian English and Pidgin terms, the setting and the mood.',
  'Reply with JSON only: {"keywords": [10 to 20 lowercase words or short phrases]}.',
].join('\n');

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export class MaasAiAdapter implements AiPort {
  private readonly logger = new Logger(MaasAiAdapter.name);
  private readonly budget: RateBudget;
  private lastModel: string;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly models: string[],
    callsPerMinute: number,
  ) {
    this.budget = new RateBudget(callsPerMinute);
    this.lastModel = models[0];
  }

  get model(): string {
    return this.lastModel;
  }

  async searchIntent(query: string): Promise<SearchIntent> {
    const reply = await this.json<{ keywords?: unknown; category?: unknown }>([
      { role: 'system', content: SEARCH_PROMPT },
      { role: 'user', content: query },
    ]);
    const category = typeof reply.category === 'string' && CATEGORIES.includes(reply.category) ? reply.category : null;
    return { keywords: cleanKeywords(reply.keywords, 8), category };
  }

  async videoKeywords(video: VideoText): Promise<string[]> {
    const reply = await this.json<{ keywords?: unknown }>([
      { role: 'system', content: VIDEO_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({ title: video.title, description: video.description, category: video.category, tags: video.tags }),
      },
    ]);
    return cleanKeywords(reply.keywords, 20);
  }

  private async json<T>(messages: ChatMessage[]): Promise<T> {
    if (!this.budget.take()) throw new AiUnavailableError('The AI budget for this minute is used up.');

    for (const model of this.models) {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          max_tokens: 300,
          chat_template_kwargs: { thinking: false },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }).catch((error: unknown) => {
        this.logger.warn(`MaaS ${model} unreachable: ${String(error)}`);
        return null;
      });
      if (!response) throw new AiUnavailableError();
      if (response.status === 404) continue;
      if (!response.ok) throw new AiUnavailableError(`MaaS answered ${response.status}`);

      const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content ?? '';
      this.lastModel = model;
      return parseJson<T>(content);
    }
    throw new AiUnavailableError('None of the configured models are available.');
  }
}

function parseJson<T>(content: string): T {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AiUnavailableError('The model did not reply with JSON.');
  try {
    return JSON.parse(content.slice(start, end + 1)) as T;
  } catch {
    throw new AiUnavailableError('The model did not reply with valid JSON.');
  }
}

function cleanKeywords(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.toLowerCase().trim())
        .filter((item) => item.length >= 2 && item.length <= 40),
    ),
  ].slice(0, max);
}
