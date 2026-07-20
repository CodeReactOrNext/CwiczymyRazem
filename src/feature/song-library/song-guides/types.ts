import type { SeoLandingPageKey } from "lib/exerciseLandingLink";

export type GuideSectionId =
  | "verdict"
  | "whoFor"
  | "techniques"
  | "songMap"
  | "timeline"
  | "mistakes"
  | "practicePlan"
  | "learningPath"
  | "progression"
  | "inlineCta"
  | "relatedExercises"
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

export interface GuideMistake {
  title: string;
  why: string;
  fix: string;
}

export interface GuidePathSong {
  title: string;
  artist: string;
  /** Editorial difficulty 1–10 for the comparison bar. */
  difficulty: number;
  why: string;
  /** Set when we also have a guide page for that song — renders as a link. */
  guideSlug?: string;
}

export interface GuideFaqEntry {
  title: string;
  message: string;
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
  /** ISO date, bump when content changes — used in sitemap + article schema. */
  publishedAt: string;
  updatedAt: string;
  seo: GuideSeo;
  h1: string;
  intro: string[];
  facts: GuideFact[];
  /** Editorial fallbacks — overridden by live community data when available. */
  editorial: {
    difficulty: number;
    timeToLearn: string;
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
  timeline: {
    heading: string;
    intro: string;
    entries: GuideTimelineEntry[];
  };
  mistakes: {
    heading: string;
    items: GuideMistake[];
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
    /** Which tier the song sits in on the D→S ladder. */
    tier: "D" | "C" | "B" | "A" | "S";
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
  customBlocks: GuideCustomBlock[];
  /** Render order — every page gets its own structure. */
  sectionOrder: GuideSectionId[];
}

/** Live data resolved server-side from Firestore when `songId` is set. */
export interface GuideLiveSong {
  id: string;
  title: string;
  artist: string;
  avgDifficulty: number;
  tier: string;
  popularity: number;
  coverUrl: string | null;
}

export interface GuideLiveData {
  song: {
    avgDifficulty: number;
    ratingsCount: number;
    tier: string;
    popularity: number;
    coverUrl: string | null;
  } | null;
  easierSongs: GuideLiveSong[];
  harderSongs: GuideLiveSong[];
}
