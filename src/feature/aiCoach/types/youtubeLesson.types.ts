export type YouTubeLessonStatus = "raw" | "indexed" | "rejected";
export type GuitarLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface YouTubeLesson {
  videoId: string;
  title: string;
  channelName: string;
  description: string;
  duration: number; // seconds
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  // AI-generated
  level?: GuitarLevel;
  topics?: string[];
  guitarStyle?: string[];
  qualityScore?: number; // 1-10
  qualityReason?: string;
  status: YouTubeLessonStatus;
  processedAt?: string;
}

export interface YouTubeLessonResult {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number;
  level?: GuitarLevel;
  topics?: string[];
  score: number;
}

export interface ScraperConfig {
  searchQueries: string[];
  minViewCount: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  excludedChannels: string[];
  minQualityScore: number;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  searchQueries: [
    "guitar lesson beginner",
    "guitar chord tutorial",
    "barre chord guitar",
    "fingerpicking guitar tutorial",
    "guitar scales practice",
    "guitar arpeggios tutorial",
    "music theory guitar",
    "guitar strumming patterns",
    "acoustic guitar lesson",
    "electric guitar technique",
  ],
  minViewCount: 5000,
  minDurationSeconds: 180,
  maxDurationSeconds: 3600,
  excludedChannels: [],
  minQualityScore: 6,
};
