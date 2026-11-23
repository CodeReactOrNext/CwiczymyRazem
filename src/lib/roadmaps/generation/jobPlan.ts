import type {
  RoadmapPhase,
  RoadmapStep,
  RoadmapVisibility,
} from "feature/aiCoach/types/roadmap.types";
import type {
  RoadmapJobStatus,
  RoadmapJobStep,
  RoadmapJobView,
} from "feature/supporterPanel/types/roadmapJob.types";

import type { QualityReport } from "./qualityGate";
import type { TokenUsage } from "./usage";

/**
 * A generation that runs on the server rather than in a browser tab: the
 * state it keeps on its ticket between the requests that advance it.
 *
 * Each advance runs as many whole units — the draft, the review, a batch of
 * phases, a batch of lesson searches, the save — as fit in one function's time
 * limit, and writes this back after every unit. Whoever advances it next, the
 * player's open tab or the cron once the tab is gone, starts from the last
 * unit that finished.
 */
export interface StoredRoadmapJob {
  status: RoadmapJobStatus;
  step: RoadmapJobStep;
  /** The skeleton once reviewed, filled in with descriptions and lessons as they land. */
  phases: RoadmapPhase[] | null;
  describedPhaseIds: string[];
  /** How many steps, in map order, have had their lesson search. */
  lessonCursor: number;
  lessonsTotal: number;
  /** Epoch ms until which one advance owns the job; 0 when nobody does. */
  leaseUntil: number;
  /** Failures in a row; the job gives up at MAX_JOB_ATTEMPTS. */
  attempts: number;
  error: string | null;
  refunded: boolean;
  /** What the job's own model calls spent, beyond what the ticket already records. */
  usage: TokenUsage | null;
  /** The finished roadmap's full model bill in USD, skeleton included; set on save. */
  costUsd?: number;
  startedAt: string;
  updatedAt: string;
  /** When the plan was shown to its owner, and whether their free round of changes is spent. */
  approval?: { askedAt: string; feedbackUsed: boolean } | null;
  /** What the owner asked to change, while the plan is being reshaped to it. */
  feedback?: string | null;
  /** What the quality gate said about the roadmap as it was saved. */
  quality?: QualityReport | null;
  /** Phases were sent back for their texts once already; the gate does not loop. */
  qualityRetried?: boolean;
}

/** The ticket fields a job reads — the rest of `GenerationTicket` is its own business. */
export interface JobTicket {
  id: string;
  uid: string;
  goal: string;
  level: string;
  roadmapId: string;
  visibility: RoadmapVisibility;
  draft: unknown[] | null;
  structure: { phases: RoadmapPhase[] } | null;
  progress: { stage: string } | null;
  job?: StoredRoadmapJob | null;
}

export const MAX_JOB_ATTEMPTS = 3;
/** Phase descriptions written at once — independent calls, one per phase. */
export const PHASE_BATCH = 3;
/** Lesson searches run at once — each is an embedding and a vector query. */
export const LESSON_BATCH = 6;
/** A job still running after this long is not coming back. */
export const JOB_GIVE_UP_MS = 6 * 60 * 60 * 1000;

/**
 * How long each unit may take, so an advance never starts one it cannot finish
 * before the function is cut off. Generous on purpose: the review can include
 * a full rewrite, which is the slowest call in the pipeline.
 */
export const UNIT_BUDGET_MS: Record<RoadmapJobStep, number> = {
  draft: 150_000,
  review: 210_000,
  // One rewrite of the skeleton to the owner's note, then the library lookups.
  reshape: 180_000,
  phases: 130_000,
  // A batch now includes the judge and, for steps the index cannot serve, a
  // live YouTube search with the analysis of what it finds.
  lessons: 120_000,
  save: 15_000,
};

const allSteps = (phases: RoadmapPhase[]) =>
  phases.flatMap((phase) =>
    phase.steps.map((step) => ({ phaseId: phase.id, step })),
  );

/** A fresh job for a ticket, picking up whatever the ticket already holds. */
export const initialJob = (ticket: JobTicket, now: Date): StoredRoadmapJob => {
  const phases = ticket.structure?.phases ?? null;
  return {
    status: "running",
    step: phases ? "phases" : ticket.draft?.length ? "review" : "draft",
    phases,
    describedPhaseIds: [],
    lessonCursor: 0,
    lessonsTotal: phases ? allSteps(phases).length : 0,
    leaseUntil: 0,
    attempts: 0,
    error: null,
    refunded: false,
    usage: null,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

export const isLeaseFree = (job: StoredRoadmapJob, now: number): boolean =>
  !job.leaseUntil || job.leaseUntil <= now;

/** The job once the reviewed skeleton is in: descriptions next. */
export const withSkeleton = (
  job: StoredRoadmapJob,
  phases: RoadmapPhase[],
): StoredRoadmapJob => ({
  ...job,
  step: "phases",
  phases,
  describedPhaseIds: [],
  lessonCursor: 0,
  lessonsTotal: allSteps(phases).length,
});

/** How long a plan waits for its owner before it is taken as approved. */
export const APPROVAL_TIMEOUT_MS = 20 * 60 * 1000;
export const MAX_FEEDBACK_LENGTH = 500;

/** The reviewed plan put in front of its owner: nothing runs until they answer. */
export const awaitingApproval = (
  job: StoredRoadmapJob,
  now: Date,
): StoredRoadmapJob => ({
  ...job,
  status: "awaiting_approval",
  leaseUntil: 0,
  feedback: null,
  approval: {
    askedAt: now.toISOString(),
    feedbackUsed: job.approval?.feedbackUsed ?? false,
  },
});

/** The owner said yes — or said nothing for long enough: on to the descriptions. */
export const approved = (job: StoredRoadmapJob): StoredRoadmapJob => ({
  ...job,
  status: "running",
  step: "phases",
  feedback: null,
});

/** The owner asked for changes: the plan goes back for its one free rewrite. */
export const withFeedback = (
  job: StoredRoadmapJob,
  feedback: string,
): StoredRoadmapJob => ({
  ...job,
  status: "running",
  step: "reshape",
  feedback: feedback.trim().slice(0, MAX_FEEDBACK_LENGTH),
  attempts: 0,
  error: null,
  approval: {
    askedAt: job.approval?.askedAt ?? new Date().toISOString(),
    feedbackUsed: true,
  },
});

export const isApprovalOverdue = (
  job: StoredRoadmapJob,
  now: number,
): boolean =>
  job.status === "awaiting_approval" &&
  now - new Date(job.approval?.askedAt ?? job.updatedAt).getTime() >
    APPROVAL_TIMEOUT_MS;

/** Indexes of the next phases to describe, in map order. */
export const nextPhaseBatch = (
  job: StoredRoadmapJob,
  size = PHASE_BATCH,
): number[] =>
  (job.phases ?? [])
    .map((phase, index) => ({ phase, index }))
    .filter(({ phase }) => !job.describedPhaseIds.includes(phase.id))
    .slice(0, size)
    .map(({ index }) => index);

/** Written phases swapped in; on to the lessons once every phase has its text. */
export const withDescribedPhases = (
  job: StoredRoadmapJob,
  described: RoadmapPhase[],
): StoredRoadmapJob => {
  const byId = new Map(described.map((phase) => [phase.id, phase]));
  const phases = (job.phases ?? []).map((phase) => byId.get(phase.id) ?? phase);
  const describedPhaseIds = [
    ...new Set([...job.describedPhaseIds, ...described.map((p) => p.id)]),
  ];
  const finished = phases.every((phase) =>
    describedPhaseIds.includes(phase.id),
  );
  return {
    ...job,
    phases,
    describedPhaseIds,
    step: finished ? "lessons" : "phases",
    lessonsTotal: allSteps(phases).length,
  };
};

/** The steps whose lesson search comes next. */
export const nextLessonBatch = (
  job: StoredRoadmapJob,
  size = LESSON_BATCH,
): { phaseId: string; step: RoadmapStep }[] =>
  allSteps(job.phases ?? []).slice(job.lessonCursor, job.lessonCursor + size);

/**
 * The lessons found for a batch attached to their steps. A step whose search
 * found nothing (or failed) simply has none; the cursor moves past it either
 * way, because a missed lesson search never sinks a roadmap.
 */
export const withLessons = (
  job: StoredRoadmapJob,
  searched: number,
  found: Record<string, string[]>,
): StoredRoadmapJob => {
  const phases = (job.phases ?? []).map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) =>
      found[step.id]?.length
        ? { ...step, suggestedLessonIds: found[step.id] }
        : step,
    ),
  }));
  const lessonCursor = Math.min(job.lessonsTotal, job.lessonCursor + searched);
  return {
    ...job,
    phases,
    lessonCursor,
    step: lessonCursor >= job.lessonsTotal ? "save" : "lessons",
  };
};

/**
 * A failed unit. The job keeps running for another try unless this was the
 * last one, or the failure is the kind a retry cannot fix — the model refusing
 * a goal that is not about guitar.
 */
export const withFailure = (
  job: StoredRoadmapJob,
  message: string,
  permanent: boolean,
): StoredRoadmapJob => {
  const attempts = job.attempts + 1;
  return {
    ...job,
    attempts,
    error: message,
    status: permanent || attempts >= MAX_JOB_ATTEMPTS ? "failed" : "running",
  };
};

/** The job as the browser gets it. */
export const toJobView = (
  ticket: JobTicket & { job: StoredRoadmapJob },
): RoadmapJobView => {
  const { job } = ticket;
  const phasesTotal = job.phases?.length ?? 0;
  return {
    ticketId: ticket.id,
    roadmapId: ticket.roadmapId,
    goal: ticket.goal,
    level: ticket.level,
    visibility: ticket.visibility,
    status: job.status,
    step: job.step,
    revising: job.step === "review" && ticket.progress?.stage === "revise",
    phasesDone: job.describedPhaseIds.length,
    phasesTotal,
    lessonsDone: job.lessonCursor,
    lessonsTotal: job.lessonsTotal,
    error: job.error,
    refunded: job.refunded,
    updatedAt: job.updatedAt,
    ...(job.status === "awaiting_approval"
      ? {
          skeleton: (job.phases ?? []).map((phase) => ({
            title: phase.title,
            steps: phase.steps.map((step) => step.title),
          })),
          feedbackLeft: !job.approval?.feedbackUsed,
        }
      : {}),
  };
};
