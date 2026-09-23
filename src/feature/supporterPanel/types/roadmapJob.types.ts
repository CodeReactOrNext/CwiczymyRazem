import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";

/** The halves of the skeleton, as the card names them while it waits. */
export type StructureStep = "draft" | "review" | "revise";

/** What the stepper and the progress bar draw. */
export type GenerationStage =
  | { name: "structure"; step: StructureStep }
  | { name: "phase"; done: number; total: number }
  | { name: "lessons"; done: number; total: number };

export type RoadmapJobStatus = "running" | "done" | "failed";

/** The unit of work a background generation is on. */
export type RoadmapJobStep = "draft" | "review" | "phases" | "lessons" | "save";

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
}

/** Where the stepper sits for a job in this state. */
export const jobStage = (job: RoadmapJobView): GenerationStage => {
  switch (job.step) {
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
