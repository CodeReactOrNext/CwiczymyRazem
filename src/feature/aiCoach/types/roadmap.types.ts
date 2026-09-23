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
