import { useQueryClient } from "@tanstack/react-query";
import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { SUPPORTER_ROADMAP_KEY } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import {
  advanceRoadmapJob,
  fetchRoadmapJob,
  startRoadmapJob,
} from "feature/supporterPanel/services/roadmapJob.service";
import {
  type GenerationStage,
  jobStage,
  type RoadmapGoalContext,
  type RoadmapJobView,
  type StructureStep,
} from "feature/supporterPanel/types/roadmapJob.types";
import type { RoadmapBoard } from "feature/supporterPanel/types/supporterPanel.types";
import type { RoadmapLevel } from "lib/roadmaps/generation/levels";
import { useCallback, useEffect, useRef, useState } from "react";

export type GenerateStatus = "idle" | "running" | "done" | "error";

/** Where the bar sits when a stage begins, and where that stage crawls towards. */
type Bounds = [from: number, to: number];

interface State {
  status: GenerateStatus;
  stageLabel: string;
  /** The stage as the job last reported it, for the stepper. */
  stage: GenerationStage | null;
  progress: number;
  bounds: Bounds;
  /** When the current stage began, so the bar can crawl away from its floor. */
  since: number;
  job: RoadmapJobView | null;
  error: string | null;
}

const IDLE_STATE: State = {
  status: "idle",
  stageLabel: "",
  stage: null,
  progress: 0,
  bounds: [0, 0],
  since: 0,
  job: null,
  error: null,
};

const STRUCTURE_LABEL: Record<StructureStep, string> = {
  draft: "Drafting the plan…",
  review: "Having the plan reviewed…",
  revise: "The reviewer asked for changes — rewriting the plan…",
};

/**
 * The bar's bands. The skeleton owns the first thirty percent because it is
 * two or three model calls; the phases own the next forty-five because they
 * are one call each; the lesson search closes it out.
 */
const STRUCTURE_BOUNDS: Record<StructureStep, Bounds> = {
  draft: [2, 14],
  review: [14, 22],
  revise: [22, 30],
};
const PHASES_BAND: Bounds = [30, 75];
const LESSONS_BAND: Bounds = [75, 99];

/** How long a stage takes to cover about two thirds of its band. */
const CRAWL_HALF_LIFE_MS = 20_000;
/** How often the bar is redrawn while a stage is still running. */
const CRAWL_TICK_MS = 1000;
/** How often the job is read while an advance request is out. */
const POLL_MS = 3000;
/** The least time between two advance requests, so a busy job is not hammered. */
const MIN_ADVANCE_GAP_MS = 5000;

/**
 * Where the bar sits partway through a stage whose end nobody can predict.
 *
 * A stage that knows only that it started cannot honestly report a number, but
 * a bar that sits on one for ninety seconds reads as a hang. This eases
 * towards the next stage's floor without ever reaching it, so the bar is
 * always moving and never overtakes the work.
 */
export const crawlProgress = (
  from: number,
  to: number,
  elapsedMs: number,
): number => {
  if (to <= from) return from;
  const eased = 1 - Math.exp(-Math.max(0, elapsedMs) / CRAWL_HALF_LIFE_MS);
  return from + (to - from) * eased;
};

/** One slice of a band: where `done` of `total` leaves the bar, and the next slice's floor. */
const segment = (band: Bounds, done: number, total: number): Bounds => {
  const [from, to] = band;
  const span = (to - from) / Math.max(1, total);
  return [
    Math.min(to, from + done * span),
    Math.min(to, from + (done + 1) * span),
  ];
};

export const stageLabel = (stage: GenerationStage): string => {
  switch (stage.name) {
    case "structure":
      return STRUCTURE_LABEL[stage.step];
    case "phase":
      return `Writing the phases (${stage.done}/${stage.total})`;
    case "lessons":
      return `Finding lessons (${stage.done}/${stage.total})`;
    default:
      return "Working…";
  }
};

const stageBounds = (stage: GenerationStage): Bounds => {
  switch (stage.name) {
    case "structure":
      return STRUCTURE_BOUNDS[stage.step];
    case "phase":
      return segment(PHASES_BAND, stage.done, stage.total);
    case "lessons":
      return segment(LESSONS_BAND, stage.done, stage.total);
    default:
      return [0, 1];
  }
};

const sameStage = (a: GenerationStage | null, b: GenerationStage) =>
  !!a && JSON.stringify(a) === JSON.stringify(b);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The state after hearing from the job — pure, so the stale answers can be dropped. */
export const applyJob = (prev: State, job: RoadmapJobView): State => {
  if (prev.job && prev.job.ticketId !== job.ticketId) return prev;

  if (job.status === "done") {
    return {
      ...prev,
      status: "done",
      stageLabel: "Done",
      progress: 100,
      bounds: [100, 100],
      job,
      error: null,
    };
  }
  if (job.status === "failed") {
    return {
      ...prev,
      status: "error",
      job,
      error: `${job.error ?? "The generation failed."}${
        job.refunded ? " Your tokens were given back." : ""
      }`,
    };
  }

  const stage = jobStage(job);
  if (sameStage(prev.stage, stage)) return { ...prev, status: "running", job };
  const bounds = stageBounds(stage);
  return {
    ...prev,
    status: "running",
    job,
    stage,
    stageLabel: stageLabel(stage),
    bounds,
    since: Date.now(),
    // A stage never moves the bar backwards, whatever its floor says.
    progress: Math.max(prev.progress, bounds[0]),
  };
};

/**
 * Drives a roadmap generation that runs on the server.
 *
 * `start` pays for it and puts it on the server; from then on this tab keeps
 * asking the server to advance it, a few minutes of work per request, and
 * reads its progress in between. The tab is a helper, not a requirement:
 * closing it leaves the job to the cron, which finishes it and sends the
 * player a notification. Opening the panel again finds the running job and
 * picks up the progress bar where it is.
 *
 * `onDone` fires once with the finished roadmap's id.
 */
export const useGenerateRoadmap = ({
  enabled = true,
  onDone,
}: {
  /** Off for anybody who cannot generate — the routes would 403. */
  enabled?: boolean;
  onDone?: (roadmapId: string) => void;
} = {}) => {
  const [state, setState] = useState<State>(IDLE_STATE);
  const queryClient = useQueryClient();
  const drivingRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const onDoneRef = useRef(onDone);
  const finishedRef = useRef<string | null>(null);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const hear = useCallback(
    (job: RoadmapJobView | null) => {
      if (!job || !mountedRef.current) return;
      setState((prev) => applyJob(prev, job));
      if (job.status === "done" && finishedRef.current !== job.ticketId) {
        finishedRef.current = job.ticketId;
        onDoneRef.current?.(job.roadmapId);
      }
      if (job.status === "failed" && job.refunded) {
        // The refund happened on the server; the wallet in the banner should say so.
        void queryClient.invalidateQueries({ queryKey: SUPPORTER_ROADMAP_KEY });
      }
    },
    [queryClient],
  );

  /** Advances the job for as long as this tab is open and the job is running. */
  const drive = useCallback(
    async (job: RoadmapJobView) => {
      if (drivingRef.current === job.ticketId) return;
      drivingRef.current = job.ticketId;
      hear(job);

      const poll = setInterval(() => {
        fetchRoadmapJob(job.ticketId).then(hear, () => {});
      }, POLL_MS);

      try {
        let current: RoadmapJobView | null = job;
        while (
          mountedRef.current &&
          drivingRef.current === job.ticketId &&
          current?.status === "running"
        ) {
          const askedAt = Date.now();
          try {
            current = await advanceRoadmapJob(job.ticketId);
            hear(current);
          } catch {
            // A dropped request changes nothing on the server; ask again.
          }
          const elapsed = Date.now() - askedAt;
          if (elapsed < MIN_ADVANCE_GAP_MS) {
            await wait(MIN_ADVANCE_GAP_MS - elapsed);
          }
        }
      } finally {
        clearInterval(poll);
        if (drivingRef.current === job.ticketId) drivingRef.current = null;
      }
    },
    [hear],
  );

  // A generation that kept running while the panel was closed.
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      fetchRoadmapJob().then(
        (job) => {
          if (job?.status === "running") void drive(job);
        },
        () => {},
      );
    }
    return () => {
      mountedRef.current = false;
      drivingRef.current = null;
    };
  }, [enabled, drive]);

  // The bar keeps moving between reports, because several stages are a single
  // model call that says nothing until it is finished.
  const running = state.status === "running";
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "running") return prev;
        const next = crawlProgress(
          prev.bounds[0],
          prev.bounds[1],
          Date.now() - prev.since,
        );
        return next > prev.progress ? { ...prev, progress: next } : prev;
      });
    }, CRAWL_TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const start = useCallback(
    async (
      title: string,
      goal: string,
      level: RoadmapLevel,
      visibility: RoadmapVisibility = "public",
      context: RoadmapGoalContext | null = null,
    ): Promise<boolean> => {
      setState({
        ...IDLE_STATE,
        status: "running",
        stageLabel: "Starting…",
        progress: 1,
        bounds: [1, 2],
        since: Date.now(),
      });
      try {
        const started = await startRoadmapJob({
          title,
          goal,
          level,
          visibility,
          context,
        });
        // The charge already happened server-side; the wallet in the banner
        // should say so without waiting for the board to refetch.
        queryClient.setQueryData<RoadmapBoard>(SUPPORTER_ROADMAP_KEY, (prev) =>
          prev ? { ...prev, wallet: started.wallet } : prev,
        );
        void drive(started.job);
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error:
            error instanceof Error ? error.message : "Something went wrong.",
        }));
        return false;
      }
    },
    [drive, queryClient],
  );

  const reset = useCallback(() => {
    drivingRef.current = null;
    setState(IDLE_STATE);
  }, []);

  return { ...state, start, reset };
};
