export interface SearchIntent {
  keywords: string[];
  category: string | null;
}

export interface VideoText {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export interface AiPort {
  readonly model: string;
  searchIntent(query: string): Promise<SearchIntent>;
  videoKeywords(video: VideoText): Promise<string[]>;
}
