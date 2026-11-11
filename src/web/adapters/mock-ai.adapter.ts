import { VideoCategory } from '../../business/domain/values/enums.js';
import { searchWords } from '../../business/domain/values/search-words.js';
import type { AiPort, SearchIntent, VideoText } from '../../business/ports/ai.port.js';

const RELATED: Record<string, string[]> = {
  wedding: ['owambe', 'bride', 'party', 'celebration', 'ceremony'],
  bride: ['wedding', 'owambe', 'ceremony'],
  party: ['owambe', 'celebration', 'dancing'],
  owambe: ['party', 'wedding', 'aso', 'aunty', 'celebration', 'dancing'],
  dancing: ['dance', 'afrobeats', 'moves'],
  dance: ['dancing', 'afrobeats', 'moves'],
  laughing: ['comedy', 'funny', 'skit'],
  funny: ['comedy', 'skit', 'laughing'],
  food: ['cooking', 'recipe', 'kitchen', 'eating'],
  cooking: ['recipe', 'kitchen', 'food'],
  rice: ['jollof', 'food', 'cooking'],
  bus: ['danfo', 'transport', 'conductor'],
  market: ['shopping', 'trader', 'bargain'],
  office: ['work', 'startup', 'tech'],
  church: ['pastor', 'prayer', 'sermon'],
};

const CATEGORY_WORDS: Record<string, VideoCategory> = {
  comedy: VideoCategory.COMEDY,
  funny: VideoCategory.COMEDY,
  skit: VideoCategory.COMEDY,
  food: VideoCategory.FOOD,
  cooking: VideoCategory.FOOD,
  recipe: VideoCategory.FOOD,
  dance: VideoCategory.DANCE,
  dancing: VideoCategory.DANCE,
  owambe: VideoCategory.OWAMBE,
  wedding: VideoCategory.OWAMBE,
  party: VideoCategory.OWAMBE,
  market: VideoCategory.LIFESTYLE,
  work: VideoCategory.LIFESTYLE,
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  [VideoCategory.COMEDY]: ['funny', 'skit', 'comedy', 'laughing'],
  [VideoCategory.FOOD]: ['food', 'cooking', 'recipe', 'kitchen'],
  [VideoCategory.DANCE]: ['dance', 'dancing', 'moves', 'afrobeats'],
  [VideoCategory.OWAMBE]: ['party', 'celebration', 'wedding', 'aso ebi', 'dancing'],
  [VideoCategory.LIFESTYLE]: ['lagos', 'everyday', 'life'],
};

export class MockAiAdapter implements AiPort {
  readonly model = 'mock';

  async searchIntent(query: string): Promise<SearchIntent> {
    const words = searchWords(query);
    const keywords = [...new Set(words.flatMap((word) => [word, ...(RELATED[word] ?? [])]))].slice(0, 10);
    const category = words.map((word) => CATEGORY_WORDS[word]).find(Boolean) ?? null;
    return { keywords, category };
  }

  async videoKeywords(video: VideoText): Promise<string[]> {
    const words = searchWords(`${video.title} ${video.tags.join(' ')}`);
    const related = words.flatMap((word) => RELATED[word] ?? []);
    return [...new Set([...(CATEGORY_KEYWORDS[video.category] ?? []), ...related])].slice(0, 15);
  }
}
