import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { SeoLandingPageKey } from "lib/exerciseLandingLink";

export type GuideSectionId =
  | "verdict"
  | "whoFor"
  | "techniques"
  | "songMap"
  | "riffPreview"
  | "timeline"
  | "practicePlan"
  | "learningPath"
  | "progression"
  | "inlineCta"
  | "relatedExercises"
  | "sources"
  | "videoLessons"
  | `custom:${string}`;

export interface GuideSeo {
  /** Full <title> content, brand included. Keep ≤ 65 chars. */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface GuideFact {
  label: string;
  value: string;
}

export interface GuideTechnique {
  name: string;
  /** 1–5 dots shown next to the technique. */
  difficulty: number;
  /** "core" renders highlighted; "bonus" is optional-to-learn. */
  role: "core" | "bonus";
  description: string;
}

export interface GuideSongSection {
  name: string;
  /** 1–10, same scale as community difficulty. */
  difficulty: number;
  description: string;
  isHardest?: boolean;
}

export interface GuideTimelineEntry {
  level: string;
  time: string;
  note: string;
}

export interface GuidePathSong {
  title: string;
  artist: string;
  /** Editorial difficulty 1–10 for the comparison bar. */
  difficulty: number;
  why: string;
  /** Set when we also have a guide page for that song — renders as a link. */
  guideSlug?: string;
  /** Firestore doc id in `songs` — set to pull real cover art for the mini-card. */
  songId?: string;
}

export interface GuideFaqEntry {
  title: string;
  message: string;
}

export interface GuideSource {
  /** What the link backs up — shown next to the citation. */
  label: string;
  /** Real, verified URL — never a guessed or fabricated one. */
  url: string;
}

export interface GuideVideoLesson {
  /** The YouTube video id, e.g. the `v=` param — real videos only, checked against oEmbed. */
  videoId: string;
  title: string;
  channelName: string;
}

/** Per-song custom blocks — this is what makes each page structurally unique. */
export type GuideCustomBlock =
  | {
      kind: "tempoLadder";
      id: string;
      heading: string;
      intro: string;
      steps: { bpm: string; goal: string }[];
    }
  | {
      kind: "patternBreakdown";
      id: string;
      heading: string;
      intro: string;
      steps: { label: string; description: string }[];
    }
  | {
      kind: "chordMap";
      id: string;
      heading: string;
      intro: string;
      chords: { name: string; shape: string; tip: string }[];
    }
  | {
      kind: "journey";
      id: string;
      heading: string;
      intro: string;
      stages: {
        name: string;
        timecode: string;
        difficulty: number;
        description: string;
        techniques: string[];
      }[];
    };

export interface SongGuide {
  slug: string;
  /**
   * Firestore doc id in `songs` — wired later by the owner. While null the
   * page renders editorial estimates; once set, community stats and similar
   * songs are pulled live at build/revalidate time.
   */
  songId: string | null;
  title: string;
  artist: string;
  /** Key into `AUTHORS` in `lib/authors.ts` — same registry the blog uses. */
  author: string;
  /** ISO date, bump when content changes — used in sitemap + article schema. */
  publishedAt: string;
  updatedAt: string;
  seo: GuideSeo;
  h1: string;
  /**
   * One bolded sentence rendered directly under the H1, before `intro` —
   * the direct answer to "how hard is this song", stated up front instead of
   * making the reader wait through warm-up paragraphs for it. Also what
   * Google has the best shot at lifting into a featured snippet.
   */
  quickAnswer: string;
  intro: string[];
  facts: GuideFact[];
  /** Editorial fallbacks — overridden by live community data when available. */
  editorial: {
    difficulty: number;
    timeToLearn: string;
    /** Used as the card blurb on /song-library and SEO landing "related guides". */
    oneLiner: string;
  };
  verdict: {
    heading: string;
    paragraphs: string[];
  };
  whoFor: {
    heading: string;
    ready: string[];
    notYet: string[];
  };
  techniques: {
    heading: string;
    intro: string;
    items: GuideTechnique[];
  };
  songMap?: {
    heading: string;
    intro: string;
    sections: GuideSongSection[];
    hardestSummary: string;
  };
  /**
   * Optional rendered-notation excerpt (AlphaTab). `measures` must be an
   * original/illustrative pattern or a properly licensed transcription —
   * never a copied excerpt from a commercial tab site. `note` should say so
   * plainly to the reader when the pattern is illustrative, not the real riff.
   */
  riffPreview?: {
    heading: string;
    intro?: string;
    note?: string;
    measures: TablatureMeasure[];
    bpm: number;
    /** BPM stepper bounds shown next to the player. Falls back to a generic range. */
    bpmMin?: number;
    bpmMax?: number;
    /** Id into `exercisesAgregat` — set to link a "Try it in Practice Session" CTA. */
    practiceExerciseId?: string;
  };
  timeline: {
    heading: string;
    intro: string;
    entries: GuideTimelineEntry[];
  };
  practicePlan: {
    heading: string;
    intro: string;
    steps: string[];
  };
  learningPath: {
    heading: string;
    intro: string;
    easier: GuidePathSong[];
    harder: GuidePathSong[];
  };
  /** SEO landing pages (exercise programs) that train this song's core techniques. */
  relatedLandingSlugs: SeoLandingPageKey[];
  progression: {
    heading: string;
    /**
     * Tier is deliberately NOT stored here — it's derived at render time from
     * live community data (falling back to `editorial.difficulty`) so the
     * ladder highlight can never drift out of sync with the score shown
     * elsewhere on the page. Keep `description` free of hardcoded tier
     * letters/numbers for the same reason.
     */
    description: string;
  };
  inlineCta: {
    heading: string;
    text: string;
  };
  finalCta: {
    headingTop: string;
    headingAccent: string;
    text: string;
  };
  faq: GuideFaqEntry[];
  /** Optional citations backing specific factual claims (tempo, quotes, etc.) — E-E-A-T signal, real outbound links only. */
  sources?: GuideSource[];
  /** Optional third-party video lessons for this song — real, checked videos only. */
  videoLessons?: GuideVideoLesson[];
  customBlocks: GuideCustomBlock[];
  /** Render order — every page gets its own structure. */
  sectionOrder: GuideSectionId[];
}

/** Live data resolved server-side from Firestore when `songId` is set. */
export interface GuideLiveData {
  song: {
    avgDifficulty: number;
    ratingsCount: number;
    tier: string;
    popularity: number;
    coverUrl: string | null;
  } | null;
}

/**
 * Live rating for a song referenced by `guideSlug` in another guide's
 * `learningPath`, keyed by that guideSlug. Lets cross-linked mini-cards show
 * the same real-time tier/score as the linked song's own page, instead of
 * trusting a hand-written `difficulty` guess that can drift once community
 * ratings come in.
 */
export type CrossGuideDifficultyMap = Record<
  string,
  { avgDifficulty: number; tier: string }
>;

/**
 * Live cover + difficulty/tier for learningPath entries keyed by `songId`,
 * regardless of whether that song also has its own Riff Quest guide page.
 */
export type PathSongLiveDataMap = Record<
  string,
  { coverUrl: string | null; avgDifficulty: number; tier: string }
>;
