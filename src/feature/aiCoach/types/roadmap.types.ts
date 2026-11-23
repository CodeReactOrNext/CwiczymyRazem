import type { RoadmapBrief } from "lib/roadmaps/generation/brief";

import type { PhaseCheckResult } from "./phaseCheck.types";
import type { YouTubeLessonResult } from "./youtubeLesson.types";

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  successCriteria: string;
  sessionsRequired: number;
  sessionsCompleted: number;
  order: number;
  suggestedExerciseId?: string;
  /** Set by the generator; decides how long the description runs. */
  skillType?: "physical" | "conceptual" | "musical";
  noExercise?: boolean;
  suggestedLessonIds?: string[];
  /** Lessons authored directly in the roadmap JSON (rendered without a Firestore lookup). */
  lessons?: YouTubeLessonResult[];
  exerciseCompleted?: boolean;
  completedLessonIds?: string[];
  /**
   * A real song from the library this step is about — only ever set when the
   * song exists there, and only on a step that is about that one song.
   * Opens the song's practice page (tab, backing track, timed practice).
   */
  suggestedSong?: RoadmapSongRef;
  songCompleted?: boolean;
  /**
   * One sentence from the plan: what the student does in this step. Written
   * with the skeleton, so every phase can be described knowing what the others
   * are about.
   */
  summary?: string;
  /**
   * How the exercise relates to the step. "support" is a warm-up or a related
   * drill — it does not contain the step's own material, and the step never
   * claims it does. Absent means the exercise trains the step directly.
   */
  exerciseRole?: "direct" | "support";
  /** Why this exercise, in the planner's words — context for the description. */
  exerciseWhy?: string;
  /**
   * How to set a configurable exercise up for this step ("A minor, i–VI–III–VII,
   * 80 BPM"), shown next to it so the player does not dig it out of the prose.
   */
  exerciseSetup?: string;
  /**
   * The song this step is about when the library did not have it at generation
   * time. Kept so the step links itself once the song is added.
   */
  songRequest?: { title: string; artist: string };
  /** Finished practice sessions started from this step — counted, never typed in. */
  practiceSessions?: number;
}

/** The library song a step practises, denormalised so the map needs no lookup. */
export interface RoadmapSongRef {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  order: number;
  steps: RoadmapStep[];
  /** The player's result on this phase's checkpoint; absent until they sit it. */
  check?: PhaseCheckResult;
}

/**
 * Who may see a generated roadmap. Public ones show up for every supporter in
 * Player Roadmaps and cost less to generate — they give something back to the
 * community; a private one serves its owner alone. Absent on roadmaps written
 * before the choice existed, which were always public.
 */
export type RoadmapVisibility = "public" | "private";

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  goal: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  phases: RoadmapPhase[];
  image?: string;
  visibility?: RoadmapVisibility;
  /**
   * What the player answered before generating — the constraints the plan was
   * built to. Kept with the roadmap so a later change to it (a rewritten step,
   * an added one) is held to the same answers.
   */
  brief?: RoadmapBrief | null;
  /** When the unlinked song steps were last looked up in the library. */
  songsCheckedAt?: string;
  /**
   * "mcp" when the player's own AI assistant wrote it through the MCP server
   * rather than the in-app generator. Such a roadmap is always private, and
   * the assistant may rewrite its steps for free.
   */
  source?: "mcp";
  /**
   * What the player asked for, one line each, as their assistant wrote it down
   * when the plan was made — so a later rewrite, in another conversation,
   * is held to the same wishes.
   */
  constraints?: string[];
  /**
   * What the subject is made of, and which steps teach each part — the course
   * outline a school written through the MCP server is checked against.
   */
  syllabus?: { topic: string; steps: string[] }[];
  /**
   * The review the plan was saved with: every criterion, the verdict and what
   * its author looked at. Kept so the review itself can be judged later.
   */
  review?: { criterion: string; pass: boolean; note: string }[];
}

// Static roadmap stored in JSON (no per-user progress data)
export type StaticRoadmapStep = Omit<RoadmapStep, "sessionsCompleted">;
export type StaticRoadmapPhase = Omit<RoadmapPhase, "steps"> & {
  steps: StaticRoadmapStep[];
};
export type StaticRoadmap = Omit<
  Roadmap,
  "userId" | "createdAt" | "updatedAt" | "phases"
> & {
  phases: StaticRoadmapPhase[];
  image?: string;
};
