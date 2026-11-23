import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";

/** The halves of the skeleton, as the card names them while it waits. */
export type StructureStep = "draft" | "review" | "revise";

/** What the stepper and the progress bar draw. */
export type GenerationStage =
  | { name: "structure"; step: StructureStep }
  | { name: "approval" }
  | { name: "phase"; done: number; total: number }
  | { name: "lessons"; done: number; total: number };

/**
 * "awaiting_approval" is the one stop on the way: the plan is drafted and
 * reviewed, and its owner gets to read it — and ask for one round of changes —
 * before the slow part is written. Nobody advances a job in that state; it
 * approves itself after a while so a closed tab still ends with a roadmap.
 */
export type RoadmapJobStatus =
  | "running"
  | "awaiting_approval"
  | "done"
  | "failed";

/** The unit of work a background generation is on. */
export type RoadmapJobStep =
  | "draft"
  | "review"
  | "reshape"
  | "phases"
  | "lessons"
  | "save";

/** One phase of the plan as the approval screen lists it. */
export interface SkeletonPhaseView {
  title: string;
  steps: string[];
}

/** A background generation as the browser sees it — no drafts, no leases. */
export interface RoadmapJobView {
  ticketId: string;
  roadmapId: string;
  goal: string;
  level: string;
  visibility: RoadmapVisibility;
  status: RoadmapJobStatus;
  step: RoadmapJobStep;
  /** The reviewer rejected the draft and the rewrite is running. */
  revising: boolean;
  phasesDone: number;
  phasesTotal: number;
  lessonsDone: number;
  lessonsTotal: number;
  /** The last failure — a retry may already be on its way while it shows. */
  error: string | null;
  /** A failed generation gave its tokens back. */
  refunded: boolean;
  updatedAt: string;
  /** The plan to read, while the job waits for its owner's OK. */
  skeleton?: SkeletonPhaseView[];
  /** Whether the free round of changes is still unused. */
  feedbackLeft?: boolean;
}

/** Where the stepper sits for a job in this state. */
export const jobStage = (job: RoadmapJobView): GenerationStage => {
  if (job.status === "awaiting_approval") return { name: "approval" };
  switch (job.step) {
    case "reshape":
      return { name: "structure", step: "revise" };
    case "draft":
      return { name: "structure", step: "draft" };
    case "review":
      return { name: "structure", step: job.revising ? "revise" : "review" };
    case "phases":
      return { name: "phase", done: job.phasesDone, total: job.phasesTotal };
    case "lessons":
      return {
        name: "lessons",
        done: job.lessonsDone,
        total: job.lessonsTotal,
      };
    case "save":
    default:
      return {
        name: "lessons",
        done: job.lessonsTotal,
        total: job.lessonsTotal,
      };
  }
};

/** What the player may add about themselves, beyond the goal — all optional. */
export interface RoadmapGoalContext {
  /** Artists, bands or songs they love. */
  favourites: string;
  /** What they can already play. */
  canPlay: string;
}
