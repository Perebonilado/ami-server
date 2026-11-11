import { VideoStatus } from '../values/enums.js';

export interface VideoProps {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  aiKeywords: string[];
  searchText: string;
  durationSec: number;
  basePriceKobo: number;
  fileSha256: string;
  fileUrl: string;
  fileSizeBytes: number;
  previewUrl: string;
  thumbnailUrl: string | null;
  posterFrom: string;
  posterTo: string;
  status: VideoStatus;
}

export class Video {
  constructor(public readonly props: VideoProps) {}

  get id() {
    return this.props.id;
  }
  get creatorId() {
    return this.props.creatorId;
  }
  get title() {
    return this.props.title;
  }
  get durationSec() {
    return this.props.durationSec;
  }
  get basePriceKobo() {
    return this.props.basePriceKobo;
  }

  isLive(): boolean {
    return this.props.status === VideoStatus.LIVE;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.creatorId === userId;
  }
}

export function buildSearchText(input: {
  title: string;
  description: string;
  category: string;
  tags: string[];
  aiKeywords: string[];
  creatorName: string;
}): string {
  return [input.title, input.description, input.category, input.creatorName, ...input.tags, ...input.aiKeywords]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
