import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type WhereOptions } from 'sequelize';
import { VideoStatus } from '../business/domain/values/enums.js';
import { normaliseQuery, searchWords, wordForms } from '../business/domain/values/search-words.js';
import type { AiPort, SearchIntent } from '../business/ports/ai.port.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { AI_PORT, CLOCK_PORT } from '../business/ports/tokens.js';
import { SearchIntentModel, VideoModel } from '../web/database/models/index.js';
import { CREATOR_INCLUDE, videoJson } from './shared/serializers.js';

const AI_MIN_WORDS = 3;
const INTENT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TERMS = 40;

export interface SearchVideosInput {
  q?: string;
  category?: string;
}

@Injectable()
export class SearchVideosQuery {
  private readonly logger = new Logger(SearchVideosQuery.name);

  constructor(
    @InjectModel(VideoModel) private readonly videos: typeof VideoModel,
    @InjectModel(SearchIntentModel) private readonly intents: typeof SearchIntentModel,
    @Inject(AI_PORT) private readonly ai: AiPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(input: SearchVideosInput) {
    const where: WhereOptions<VideoModel> = { status: VideoStatus.LIVE };
    if (input.category) Object.assign(where, { category: input.category });

    const query = normaliseQuery(input.q ?? '');
    const words = searchWords(query);
    if (!words.length) {
      const rows = await this.videos.findAll({ where, include: [CREATOR_INCLUDE], order: [['createdAt', 'DESC']] });
      return { videos: rows.map(videoJson) };
    }

    const intent = words.length >= AI_MIN_WORDS ? await this.intent(query, words) : { keywords: [], category: null };
    const wordGroups = words.map(wordForms);
    const termGroups = [...new Set([...words, ...intent.keywords.flatMap(searchWords)])].map(wordForms);
    const terms = [...new Set(termGroups.flat())].slice(0, MAX_TERMS);

    const rows = await this.videos.findAll({
      where: { ...where, [Op.or]: terms.map((term) => ({ searchText: { [Op.like]: `%${term}%` } })) },
      include: [CREATOR_INCLUDE],
    });

    const candidates = rows.map((row) => ({ row, tokens: tokenSet(row.searchText) }));
    const weights = new Map(
      termGroups.map((forms) => {
        const found = candidates.filter((item) => matches(forms, item.tokens)).length;
        return [forms[0], found ? Math.log(1 + candidates.length / found) : 0];
      }),
    );
    const weigh = (groups: string[][]) => groups.reduce((total, forms) => total + (weights.get(forms[0]) ?? 0), 0);

    const needed = intent.keywords.length ? 1 : Math.ceil(words.length / 2);
    const ranked = candidates
      .map(({ row, tokens }) => {
        const wordHits = wordGroups.filter((forms) => matches(forms, tokens));
        const termHits = termGroups.filter((forms) => matches(forms, tokens));
        const boost = intent.category && row.category === intent.category ? 1 : 0;
        return {
          row,
          hits: intent.keywords.length ? termHits.length : wordHits.length,
          score: weigh(wordHits) * 3 + weigh(termHits) + boost,
        };
      })
      .filter((item) => item.hits >= needed)
      .sort((a, b) => b.score - a.score || (b.row.createdAt as Date).getTime() - (a.row.createdAt as Date).getTime());

    return { videos: ranked.map((item) => videoJson(item.row)) };
  }

  private async intent(query: string, words: string[]): Promise<SearchIntent> {
    const now = this.clock.now();
    const queryKey = query.slice(0, 200);
    const cached = await this.intents.findOne({ where: { queryKey, expiresAt: { [Op.gt]: now } } });
    if (cached) return { keywords: cached.keywords, category: cached.category };

    try {
      const intent = await this.ai.searchIntent(query);
      await this.intents.upsert({
        queryKey,
        keywords: intent.keywords,
        category: intent.category,
        model: this.ai.model,
        expiresAt: new Date(now.getTime() + INTENT_TTL_MS),
      });
      return intent;
    } catch (error) {
      this.logger.warn(`Search intent unavailable, using plain words for "${query}": ${String(error)}`);
      return { keywords: words, category: null };
    }
  }
}

const PREFIX_MIN = 5;

function tokenSet(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
}

function matches(forms: string[], tokens: Set<string>): boolean {
  return forms.some(
    (form) => tokens.has(form) || (form.length >= PREFIX_MIN && [...tokens].some((token) => token.startsWith(form))),
  );
}
