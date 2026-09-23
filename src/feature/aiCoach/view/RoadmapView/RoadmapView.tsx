import { cn } from "assets/lib/utils";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Dumbbell,
  Loader2,
  Lock,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";

import { isRewardableRoadmap } from "../../data/roadmapRewards";
import { firebaseUpdateRoadmap } from "../../services/roadmap.service";
import { firebaseGetLessonsByIds } from "../../services/youtubeLesson.service";
import type { RefineTransport } from "../../types/refine.types";
import type {
  Roadmap,
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "../../types/roadmap.types";
import type { YouTubeLessonResult } from "../../types/youtubeLesson.types";
import type { PhaseCheckState } from "../../utils/phaseCheck";
import {
  countPassedCheckpoints,
  getNextCheckpoint,
  getPhaseCheckState,
  isPhaseCleared,
  withCheckAttempt,
} from "../../utils/phaseCheck";
import type { RoadmapStepRef } from "../../utils/roadmapSteps";
import {
  findRoadmapStep,
  flattenRoadmapSteps,
  getNextUnfinishedStep,
} from "../../utils/roadmapSteps";
import type { StepStatus } from "../../utils/stepStatus";
import {
  getStepStatus,
  sessionsForStatus,
  withResourceStatus,
} from "../../utils/stepStatus";
import LessonPracticeModal from "./components/LessonPracticeModal";
import { PhaseCheckDrawer } from "./components/PhaseCheckDrawer";
import { RoadmapFinishCard } from "./components/RoadmapFinishCard";
import type {
  StepDrawerAdminProps,
  StepDrawerView,
} from "./components/StepDrawer";
import { StepDrawer } from "./components/StepDrawer";
import type { RefineBusy } from "./components/StepRefineMenu";
import { isRefineBusy, StepRefineMenu } from "./components/StepRefineMenu";

// ─── Map styling ─────────────────────────────────────────────────────────────

const STEP_CLS: Record<StepStatus, string> = {
  "not-started": "bg-zinc-900 text-zinc-300 hover:bg-zinc-800/80",
  "in-progress": "bg-amber-500/10 text-amber-200 hover:bg-amber-500/15",
  done: "bg-emerald-950/30 text-emerald-400/80 hover:bg-emerald-950/50",
};

const STATUS_DOT: Record<StepStatus, string> = {
  "not-started": "bg-zinc-600",
  "in-progress": "bg-amber-400",
  done: "bg-emerald-500",
};

const PATH_COLOR: Record<StepStatus, string> = {
  "not-started": "#3f3f46",
  "in-progress": "#78350f",
  done: "#065f46",
};

const PHASE_BADGE = [
  "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30",
  "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
  "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
  "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30",
  "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
];

const LEGEND: { status: StepStatus; label: string }[] = [
  { status: "not-started", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "done", label: "Done" },
];

// ─── Small pieces of the map ─────────────────────────────────────────────────

interface StepMapButtonProps {
  step: RoadmapStep;
  isActive: boolean;
  isLoading: boolean;
  textAlign: "left" | "right";
  fullWidth?: boolean;
  /** Marks the node the connector lines attach to (the desktop copy of the step). */
  connector?: boolean;
  onClick: () => void;
}

const StepMapButton = ({
  step,
  isActive,
  isLoading,
  textAlign,
  fullWidth = false,
  connector = false,
  onClick,
}: StepMapButtonProps) => {
  const status = getStepStatus(step);
  return (
    <button
      type='button'
      data-step-id={connector ? step.id : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        STEP_CLS[status],
        fullWidth ? "w-full" : "max-w-[260px]",
        textAlign === "right" ? "text-right" : "text-left",
        isActive &&
          "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950",
      )}>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isLoading ? "animate-pulse bg-zinc-500" : STATUS_DOT[status],
        )}
      />
      <span>{step.title}</span>
    </button>
  );
};

const CHECK_CLS: Record<PhaseCheckState, string> = {
  locked: "bg-zinc-900/40 text-zinc-500 hover:bg-zinc-900/70",
  ready: "bg-amber-500/10 text-amber-200 hover:bg-amber-500/15",
  passed: "bg-emerald-950/30 text-emerald-400/80 hover:bg-emerald-950/50",
};

const CHECK_LABEL: Record<PhaseCheckState, string> = {
  locked: "Checkpoint",
  ready: "Checkpoint · ready",
  passed: "Checkpoint · passed",
};

interface CheckpointMapButtonProps {
  phase: RoadmapPhase;
  isActive: boolean;
  textAlign: "left" | "right";
  fullWidth?: boolean;
  /** Marks the node the connector line attaches to (the desktop copy). */
  connector?: boolean;
  onClick: () => void;
}

/** The quiz at the end of a phase, drawn after its steps as one more node. */
const CheckpointMapButton = ({
  phase,
  isActive,
  textAlign,
  fullWidth = false,
  connector = false,
  onClick,
}: CheckpointMapButtonProps) => {
  const state = getPhaseCheckState(phase);
  const Icon =
    state === "locked" ? Lock : state === "passed" ? Check : ClipboardCheck;
  return (
    <button
      type='button'
      data-check-id={connector ? phase.id : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        CHECK_CLS[state],
        fullWidth ? "w-full" : "max-w-[260px]",
        textAlign === "right" ? "flex-row-reverse text-right" : "text-left",
        isActive &&
          "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950",
      )}>
      <Icon className='h-3.5 w-3.5 shrink-0' />
      <span>
        {CHECK_LABEL[state]}
        {state === "passed" && phase.check && (
          <span className='ml-1.5 tabular-nums opacity-70'>
            {phase.check.bestScore}/{phase.check.total}
          </span>
        )}
      </span>
    </button>
  );
};

const PhaseBadge = ({
  phaseIdx,
  allDone,
}: {
  phaseIdx: number;
  allDone: boolean;
}) => (
  <span
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded text-[11px] font-bold transition-colors",
      allDone
        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
        : PHASE_BADGE[phaseIdx % PHASE_BADGE.length],
    )}>
    {allDone ? <Check className='h-4 w-4' /> : phaseIdx + 1}
  </span>
);

// ─── Data helpers ────────────────────────────────────────────────────────────

const withId = (set: Set<string>, id: string) => new Set(set).add(id);
const withoutId = (set: Set<string>, id: string) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

/**
 * The generation routes take the admin password; the editor only ever runs
 * for the admin, so a missing password simply makes them fail loudly.
 */
const generationHeaders = (adminPassword?: string) => ({
  "Content-Type": "application/json",
  ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
});

const readJson = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

/** One step written by the coach, in the context of its whole phase. */
const fetchStepDetail = async (
  roadmap: Roadmap,
  ref: RoadmapStepRef,
  phases: RoadmapPhase[],
  adminPassword?: string,
): Promise<RoadmapStep> => {
  const { step, phaseIdx } = ref;
  const res = await fetch("/api/generate-phase-details", {
    method: "POST",
    headers: generationHeaders(adminPassword),
    body: JSON.stringify({
      goal: roadmap.goal,
      level: roadmap.level,
      phases,
      phaseIndex: phaseIdx,
      stepIds: [step.id],
    }),
  });
  const data = (await readJson(res)) as { phase?: RoadmapPhase };
  const written = data.phase?.steps.find((s) => s.id === step.id);
  if (!written?.description) throw new Error("No description returned");
  return written;
};

const enrichStep = (step: RoadmapStep, written: RoadmapStep): RoadmapStep => ({
  ...step,
  description: written.description,
  successCriteria: written.successCriteria,
  sessionsRequired: written.sessionsRequired,
});

const searchExercise = async (
  roadmap: Roadmap,
  step: RoadmapStep,
  adminPassword?: string,
): Promise<string[]> => {
  const res = await fetch("/api/search-exercise", {
    method: "POST",
    headers: generationHeaders(adminPassword),
    body: JSON.stringify({
      stepTitle: step.title,
      description: step.description || "",
      goal: roadmap.goal,
      level: roadmap.level,
    }),
  });
  const data = await readJson(res);
  return (data.exercise_ids ?? []) as string[];
};

const searchLessons = async (
  roadmap: Roadmap,
  step: RoadmapStep,
  adminPassword?: string,
): Promise<YouTubeLessonResult[]> => {
  const res = await fetch("/api/search-youtube-lessons", {
    method: "POST",
    headers: generationHeaders(adminPassword),
    body: JSON.stringify({
      stepTitle: step.title,
      stepDescription: step.description || "",
      roadmapGoal: roadmap.goal,
      roadmapLevel: roadmap.level,
    }),
  });
  const data = await readJson(res);
  return (data.lessons ?? []) as YouTubeLessonResult[];
};

/** Inline lessons (authored in the roadmap JSON) first, then the indexed ones, deduped by video. */
const loadStepLessons = async (
  step: RoadmapStep,
): Promise<YouTubeLessonResult[]> => {
  const inline = step.lessons ?? [];
  let fromIds: YouTubeLessonResult[] = [];
  if (step.suggestedLessonIds?.length) {
    const stored = await firebaseGetLessonsByIds(step.suggestedLessonIds);
    fromIds = stored.map((l) => ({
      videoId: l.videoId,
      title: l.title,
      channelName: l.channelName,
      thumbnailUrl: l.thumbnailUrl,
      duration: l.duration,
      level: l.level,
      topics: l.topics,
      score: l.qualityScore ?? 0,
    }));
  }
  const seen = new Set(inline.map((l) => l.videoId));
  return [...inline, ...fromIds.filter((l) => !seen.has(l.videoId))];
};

const parseYouTubeId = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
};

/** The DOM nodes the connector lines run between, keyed by id. */
const collectNodes = (
  container: HTMLElement,
  attribute: "data-phase-id" | "data-step-id" | "data-check-id",
) => {
  const nodes = new Map<string, HTMLElement>();
  container.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach((el) => {
    const id = el.getAttribute(attribute);
    if (id) nodes.set(id, el);
  });
  return nodes;
};

interface SvgPath {
  d: string;
  key: string;
  status: StepStatus;
}

interface BatchState {
  label: string;
  color: string;
  done: number;
  total: number;
}

interface RoadmapViewProps {
  roadmap: Roadmap;
  /** The step to open straight away — the `?step=` of a deep link or a return trip. */
  initialStepId?: string;
  onUpdate?: (roadmap: Roadmap) => void;
  onPersist?: (phases: RoadmapPhase[]) => Promise<void>;
  adminMode?: boolean;
  /** Sent with every generation request the admin actions make. */
  adminPassword?: string;
  /** Somebody else's roadmap: the map can be read, its checkpoints not sat. */
  readOnly?: boolean;
  /**
   * The owner's paid refining kit. With it, every step's drawer offers to have
   * the coach redo the step, and the map takes the answers.
   */
  refine?: RefineTransport;
  /**
   * Where a change to the plan itself goes — a rewritten step, a swapped
   * exercise, a step added or removed. Progress keeps going through
   * `onPersist`; the two live in different documents.
   */
  onContentChange?: (phases: RoadmapPhase[]) => Promise<void>;
}

/**
 * The roadmap as a map: phases down the spine, steps branching off, the
 * reward at the bottom. A step opens in a side drawer, so the map stays in
 * view and the drawer's prev/next walk the whole path. The open step also
 * lives in the URL (`?step=`), so a refresh, or coming back from the exercise
 * page, lands in the same place.
 */
const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  initialStepId,
  onUpdate,
  onPersist,
  adminMode = false,
  adminPassword,
  readOnly = false,
  refine,
  onContentChange,
}) => {
  const router = useRouter();

  const persist = useCallback(
    async (phases: RoadmapPhase[]) => {
      if (onPersist) await onPersist(phases);
      else await firebaseUpdateRoadmap(roadmap.id, { phases });
    },
    [onPersist, roadmap.id],
  );

  const [phases, setPhases] = useState<RoadmapPhase[]>(roadmap.phases ?? []);
  // Mirror for async work (batches, fetches) that outlives the render it started in.
  const phasesRef = useRef(phases);
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);

  // The active step outlives the drawer being open: closing keeps it so the
  // panel has content while it slides out, and so the map remembers the spot.
  const [activeStepId, setActiveStepId] = useState<string | null>(() =>
    initialStepId &&
    roadmap.phases.some((p) => p.steps.some((s) => s.id === initialStepId))
      ? initialStepId
      : null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => activeStepId !== null);

  // The checkpoint panel, same shape: the phase outlives the panel being open.
  const [activeCheckPhaseId, setActiveCheckPhaseId] = useState<string | null>(
    null,
  );
  const [isCheckOpen, setIsCheckOpen] = useState(false);

  const [practiceLesson, setPracticeLesson] = useState<{
    lesson: YouTubeLessonResult;
    stepId: string;
    phaseId: string;
  } | null>(null);

  // Lessons per step. Missing = not loaded yet (the effect below fetches for the open step).
  const [lessonsCache, setLessonsCache] = useState<
    Record<string, YouTubeLessonResult[]>
  >({});
  const lessonsInFlight = useRef<Set<string>>(new Set());
  // A step without a description is generated while open; a failure is remembered so it can be retried.
  const [detailFailedIds, setDetailFailedIds] = useState<Set<string>>(
    new Set(),
  );
  const detailInFlight = useRef<Set<string>>(new Set());

  // Admin only
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingExerciseIds, setLoadingExerciseIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingLessonIds, setLoadingLessonIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingSongIds, setLoadingSongIds] = useState<Set<string>>(new Set());
  // Refine mode: which paid action is running, per step.
  const [refineBusyIds, setRefineBusyIds] = useState<
    Record<string, RefineBusy>
  >({});
  const [exerciseOptions, setExerciseOptions] = useState<
    Record<string, string[]>
  >({});
  const [customLessonInput, setCustomLessonInput] = useState<
    Record<string, string>
  >({});
  const [addingCustomLesson, setAddingCustomLesson] = useState<Set<string>>(
    new Set(),
  );
  const [batch, setBatch] = useState<BatchState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<SvgPath[]>([]);
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0 });

  // ─── Derived ───────────────────────────────────────────────────────────────

  const steps = useMemo(() => flattenRoadmapSteps(phases), [phases]);
  const activeStep = useMemo(
    () => findRoadmapStep(steps, activeStepId),
    [steps, activeStepId],
  );
  const upNext = useMemo(() => getNextUnfinishedStep(steps), [steps]);
  const nextCheckpoint = useMemo(() => getNextCheckpoint(phases), [phases]);
  const passedCheckpoints = useMemo(
    () => countPassedCheckpoints(phases),
    [phases],
  );
  const activeCheck = useMemo(() => {
    const phaseIdx = phases.findIndex((p) => p.id === activeCheckPhaseId);
    return phaseIdx === -1 ? null : { phase: phases[phaseIdx], phaseIdx };
  }, [phases, activeCheckPhaseId]);
  const doneCount = useMemo(
    () => steps.filter((r) => getStepStatus(r.step) === "done").length,
    [steps],
  );
  const inProgressCount = useMemo(
    () => steps.filter((r) => getStepStatus(r.step) === "in-progress").length,
    [steps],
  );
  // Progress is session-based so partially-practiced steps still move the bar.
  const progress = useMemo(() => {
    const { completed, total } = steps.reduce(
      (acc, { step }) => {
        const required = step.sessionsRequired || 0;
        acc.total += required;
        acc.completed += Math.min(step.sessionsCompleted || 0, required);
        return acc;
      },
      { completed: 0, total: 0 },
    );
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [steps]);

  // ─── Connector lines ───────────────────────────────────────────────────────

  const recalcPaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0) return;

    const phaseNodes = collectNodes(container, "data-phase-id");
    const stepNodes = collectNodes(container, "data-step-id");
    const checkNodes = collectNodes(container, "data-check-id");

    const newPaths: SvgPath[] = [];
    phases.forEach((phase, phaseIdx) => {
      const phaseEl = phaseNodes.get(phase.id);
      if (!phaseEl) return;
      const pRect = phaseEl.getBoundingClientRect();
      const pCY = pRect.top + pRect.height / 2 - cRect.top;
      const pLX = pRect.left - cRect.left;
      const pRX = pRect.right - cRect.left;
      const stepsRight = phaseIdx % 2 === 0;

      // The checkpoint hangs off the phase like one more step, in the
      // colour of where it stands.
      const checkState = getPhaseCheckState(phase);
      const targets: { key: string; el: HTMLElement; status: StepStatus }[] =
        phase.steps.flatMap((step) => {
          const el = stepNodes.get(step.id);
          return el ? [{ key: step.id, el, status: getStepStatus(step) }] : [];
        });
      const checkEl = checkNodes.get(phase.id);
      if (checkEl) {
        targets.push({
          key: `check-${phase.id}`,
          el: checkEl,
          status:
            checkState === "passed"
              ? "done"
              : checkState === "ready"
                ? "in-progress"
                : "not-started",
        });
      }

      targets.forEach(({ key, el, status }) => {
        const sRect = el.getBoundingClientRect();
        const sCY = sRect.top + sRect.height / 2 - cRect.top;

        let d: string;
        if (stepsRight) {
          const x0 = pRX;
          const x3 = sRect.left - cRect.left;
          const span = x3 - x0;
          d = `M ${x0} ${pCY} C ${x0 + span * 0.75} ${pCY} ${x0 + span * 0.25} ${sCY} ${x3} ${sCY}`;
        } else {
          const x0 = pLX;
          const x3 = sRect.right - cRect.left;
          const span = x0 - x3;
          d = `M ${x0} ${pCY} C ${x0 - span * 0.75} ${pCY} ${x0 - span * 0.25} ${sCY} ${x3} ${sCY}`;
        }
        newPaths.push({ d, key: `${phase.id}-${key}`, status });
      });
    });

    setSvgPaths(newPaths);
    setSvgDims({ w: cRect.width, h: cRect.height });
  }, [phases]);

  useEffect(() => {
    const t = setTimeout(recalcPaths, 60);
    return () => clearTimeout(t);
  }, [recalcPaths]);

  useEffect(() => {
    window.addEventListener("resize", recalcPaths);
    return () => window.removeEventListener("resize", recalcPaths);
  }, [recalcPaths]);

  // ─── State plumbing ────────────────────────────────────────────────────────

  /** Replaces one step, keeps the ref in sync for async callers, tells the parent. */
  const patchStep = useCallback(
    (
      phaseId: string,
      stepId: string,
      patch: (step: RoadmapStep) => RoadmapStep,
    ): RoadmapPhase[] => {
      const next = phasesRef.current.map((p) =>
        p.id !== phaseId
          ? p
          : {
              ...p,
              steps: p.steps.map((s) => (s.id !== stepId ? s : patch(s))),
            },
      );
      phasesRef.current = next;
      setPhases(next);
      onUpdate?.({
        ...roadmap,
        phases: next,
        updatedAt: new Date().toISOString(),
      });
      return next;
    },
    [roadmap, onUpdate],
  );

  /** A patch the player made — persisted straight away. */
  const saveStep = useCallback(
    (
      phaseId: string,
      stepId: string,
      patch: (step: RoadmapStep) => RoadmapStep,
    ) => {
      persist(patchStep(phaseId, stepId, patch)).catch(() =>
        toast.error("Failed to save."),
      );
    },
    [patchStep, persist],
  );

  /** Mirrors the open step into the URL so a refresh or a return trip lands on it again. */
  const syncStepQuery = useCallback(
    (stepId: string | null) => {
      const query: Record<string, string | string[]> = {};
      Object.entries(router.query).forEach(([key, value]) => {
        if (value !== undefined && key !== "step") query[key] = value;
      });
      query.roadmapId = roadmap.id;
      if (stepId) query.step = stepId;
      void router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router, roadmap.id],
  );

  const openStep = useCallback(
    (ref: RoadmapStepRef) => {
      setActiveStepId(ref.step.id);
      setIsDrawerOpen(true);
      syncStepQuery(ref.step.id);
    },
    [syncStepQuery],
  );

  const closeStep = useCallback(() => {
    setIsDrawerOpen(false);
    syncStepQuery(null);
  }, [syncStepQuery]);

  // ─── Checkpoints ───────────────────────────────────────────────────────────

  /** One panel at a time: opening a checkpoint puts the step away first. */
  const openCheckpoint = useCallback(
    (phaseId: string) => {
      if (isDrawerOpen) closeStep();
      setActiveCheckPhaseId(phaseId);
      setIsCheckOpen(true);
    },
    [isDrawerOpen, closeStep],
  );

  const closeCheckpoint = useCallback(() => setIsCheckOpen(false), []);

  /** An attempt is recorded the moment the last question is answered. */
  const handleCheckResult = useCallback(
    (phaseId: string, score: number, total: number) => {
      const next = phasesRef.current.map((p) =>
        p.id !== phaseId ? p : withCheckAttempt(p, score, total),
      );
      phasesRef.current = next;
      setPhases(next);
      onUpdate?.({
        ...roadmap,
        phases: next,
        updatedAt: new Date().toISOString(),
      });
      persist(next).catch(() => toast.error("Failed to save."));
    },
    [onUpdate, persist, roadmap],
  );

  const navigateStep = useCallback(
    (stepId: string) => {
      const ref = findRoadmapStep(steps, stepId);
      if (ref) openStep(ref);
    },
    [steps, openStep],
  );

  // The open step's lessons, fetched once and kept.
  useEffect(() => {
    if (adminMode || !activeStep) return;
    const { step } = activeStep;
    if (
      lessonsCache[step.id] !== undefined ||
      lessonsInFlight.current.has(step.id)
    )
      return;
    lessonsInFlight.current.add(step.id);
    loadStepLessons(step)
      .then((lessons) =>
        setLessonsCache((prev) => ({ ...prev, [step.id]: lessons })),
      )
      .catch(() => setLessonsCache((prev) => ({ ...prev, [step.id]: [] })))
      .finally(() => lessonsInFlight.current.delete(step.id));
  }, [activeStep, adminMode, lessonsCache]);

  // An open step with no copy yet gets written by the coach — in the editor
  // only. A player, or a supporter browsing somebody else's roadmap, sees the
  // blank rather than triggering a generation on somebody else's plan.
  useEffect(() => {
    if (!adminMode || !activeStep || activeStep.step.description) return;
    const { step, phase } = activeStep;
    if (detailFailedIds.has(step.id) || detailInFlight.current.has(step.id))
      return;
    detailInFlight.current.add(step.id);
    fetchStepDetail(roadmap, activeStep, phasesRef.current, adminPassword)
      .then((data) => {
        const saved = patchStep(phase.id, step.id, (s) => enrichStep(s, data));
        return persist(saved).catch(() => toast.error("Failed to save."));
      })
      .catch((err) => {
        console.warn("Failed to fetch step detail:", err);
        setDetailFailedIds((prev) => withId(prev, step.id));
      })
      .finally(() => detailInFlight.current.delete(step.id));
  }, [
    activeStep,
    adminMode,
    adminPassword,
    detailFailedIds,
    patchStep,
    persist,
    roadmap,
  ]);

  // ─── Player actions ────────────────────────────────────────────────────────

  const handleToggleExercise = () => {
    if (!activeStep) return;
    const { step, phase } = activeStep;
    const lessons = lessonsCache[step.id] ?? [];
    saveStep(phase.id, step.id, (s) =>
      withResourceStatus(
        { ...s, exerciseCompleted: !s.exerciseCompleted },
        lessons,
      ),
    );
  };

  const handleToggleSong = () => {
    if (!activeStep) return;
    const { step, phase } = activeStep;
    const lessons = lessonsCache[step.id] ?? [];
    saveStep(phase.id, step.id, (s) =>
      withResourceStatus({ ...s, songCompleted: !s.songCompleted }, lessons),
    );
  };

  /** The song's own practice page: tab, backing track, timed practice. */
  const handleOpenSong = (songId: string) => {
    const returnTo = `/ai-coach?roadmapId=${roadmap.id}${activeStep ? `&step=${activeStep.step.id}` : ""}`;
    void router.push(
      `/songs/practice/${songId}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleToggleLesson = (videoId: string) => {
    if (!activeStep) return;
    const { step, phase } = activeStep;
    const lessons = lessonsCache[step.id] ?? [];
    saveStep(phase.id, step.id, (s) => {
      const current = s.completedLessonIds ?? [];
      const next = current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId];
      return withResourceStatus({ ...s, completedLessonIds: next }, lessons);
    });
  };

  // The practice window forces a lesson to "watched" on finish (never toggles it back off).
  const markLessonWatched = (
    phaseId: string,
    stepId: string,
    videoId: string,
  ) => {
    const step = phasesRef.current
      .find((p) => p.id === phaseId)
      ?.steps.find((s) => s.id === stepId);
    if (!step || step.completedLessonIds?.includes(videoId)) return;
    const lessons = lessonsCache[stepId] ?? [];
    saveStep(phaseId, stepId, (s) =>
      withResourceStatus(
        {
          ...s,
          completedLessonIds: [...(s.completedLessonIds ?? []), videoId],
        },
        lessons,
      ),
    );
  };

  const handleSetStatus = (status: StepStatus) => {
    if (!activeStep) return;
    saveStep(activeStep.phase.id, activeStep.step.id, (s) => ({
      ...s,
      sessionsCompleted: sessionsForStatus(s, status),
    }));
  };

  const handleOpenExercise = (exerciseId: string) => {
    const returnTo = `/ai-coach?roadmapId=${roadmap.id}${activeStep ? `&step=${activeStep.step.id}` : ""}`;
    void router.push(
      `/profile/skills?exerciseId=${exerciseId}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleRetryDetail = () => {
    if (activeStep)
      setDetailFailedIds((prev) => withoutId(prev, activeStep.step.id));
  };

  // ─── Admin actions ─────────────────────────────────────────────────────────

  const handleEditStep = useCallback(
    (stepId: string, phaseId: string, updates: Partial<RoadmapStep>) => {
      patchStep(phaseId, stepId, (s) => ({ ...s, ...updates }));
    },
    [patchStep],
  );

  /** Clears the copy; the detail effect above then writes it again. */
  const handleRegenerateStep = (ref: RoadmapStepRef) => {
    setDetailFailedIds((prev) => withoutId(prev, ref.step.id));
    patchStep(ref.phase.id, ref.step.id, (s) => ({
      ...s,
      description: "",
      successCriteria: "",
    }));
  };

  const handleFindExercises = async (step: RoadmapStep) => {
    setLoadingExerciseIds((prev) => withId(prev, step.id));
    try {
      const ids = await searchExercise(roadmap, step, adminPassword);
      setExerciseOptions((prev) => ({ ...prev, [step.id]: ids.slice(0, 3) }));
    } catch {
      toast.error("Exercise search failed.");
    } finally {
      setLoadingExerciseIds((prev) => withoutId(prev, step.id));
    }
  };

  const handleSelectExercise = (
    stepId: string,
    phaseId: string,
    exerciseId: string,
  ) => {
    handleEditStep(stepId, phaseId, { suggestedExerciseId: exerciseId });
    setExerciseOptions((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  const handleFindLessons = async (step: RoadmapStep, phase: RoadmapPhase) => {
    if (loadingLessonIds.has(step.id)) return;
    setLessonsCache((prev) => {
      const next = { ...prev };
      delete next[step.id];
      return next;
    });
    setLoadingLessonIds((prev) => withId(prev, step.id));
    try {
      const lessons = await searchLessons(roadmap, step, adminPassword);
      setLessonsCache((prev) => ({ ...prev, [step.id]: lessons }));
      if (lessons.length) {
        handleEditStep(step.id, phase.id, {
          suggestedLessonIds: lessons.map((l) => l.videoId),
        });
      }
    } catch {
      toast.error("Lesson search failed.");
    } finally {
      setLoadingLessonIds((prev) => withoutId(prev, step.id));
    }
  };

  /**
   * Which song the step is about, if the library has it. The model only names
   * the song; the `songs` collection is the one that says yes or no, so a
   * step never links to a song the app cannot open.
   */
  const handleFindSong = async (step: RoadmapStep, phase: RoadmapPhase) => {
    if (loadingSongIds.has(step.id)) return;
    setLoadingSongIds((prev) => withId(prev, step.id));
    try {
      const res = await fetch("/api/search-song", {
        method: "POST",
        headers: generationHeaders(adminPassword),
        body: JSON.stringify({
          stepTitle: step.title,
          description: step.description || "",
          goal: roadmap.goal,
        }),
      });
      const data = (await readJson(res)) as {
        requested: { title: string; artist: string } | null;
        song: RoadmapSongRef | null;
      };
      if (data.song) {
        const song = data.song;
        patchStep(phase.id, step.id, (s) => ({ ...s, suggestedSong: song }));
        toast.success(`Linked to "${song.title}" by ${song.artist}.`);
      } else if (data.requested) {
        toast.info(
          `"${data.requested.title}" by ${data.requested.artist} is not in the song library.`,
        );
      } else {
        toast.info("This step is not about one particular song.");
      }
    } catch (err) {
      console.error("Song search failed:", err);
      toast.error("Song search failed.");
    } finally {
      setLoadingSongIds((prev) => withoutId(prev, step.id));
    }
  };

  const handleRemoveSong = (stepId: string, phaseId: string) => {
    patchStep(phaseId, stepId, ({ suggestedSong: _song, ...rest }) => ({
      ...rest,
      songCompleted: false,
    }));
  };

  // ─── Refine: the owner's paid changes ──────────────────────────────────────

  /** A change to the plan itself — into the roadmap document, not the progress one. */
  const saveContent = useCallback(
    (next: RoadmapPhase[]) =>
      (onContentChange ?? persist)(next).catch(() =>
        toast.error("Failed to save the change."),
      ),
    [onContentChange, persist],
  );

  /** Replaces one whole phase, keeps the ref in sync for async callers, tells the parent. */
  const replacePhase = useCallback(
    (
      phaseId: string,
      patch: (phase: RoadmapPhase) => RoadmapPhase,
    ): RoadmapPhase[] => {
      const next = phasesRef.current.map((p) =>
        p.id !== phaseId ? p : patch(p),
      );
      phasesRef.current = next;
      setPhases(next);
      onUpdate?.({
        ...roadmap,
        phases: next,
        updatedAt: new Date().toISOString(),
      });
      return next;
    },
    [roadmap, onUpdate],
  );

  const setRefineBusy = (stepId: string, key: keyof RefineBusy, on: boolean) =>
    setRefineBusyIds((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], [key]: on },
    }));

  const dropExerciseOptions = (stepId: string) =>
    setExerciseOptions((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });

  /** The server refunds a failed call before it answers, so the message is all there is to show. */
  const refineFailed = (error: unknown) =>
    toast.error(
      error instanceof Error ? error.message : "The change did not go through.",
    );

  const refineRewrite = async (ref: RoadmapStepRef, note: string) => {
    if (!refine) return;
    const { step, phase, phaseIdx } = ref;
    setRefineBusy(step.id, "rewriteStep", true);
    setLoadingDetailIds((prev) => withId(prev, step.id));
    try {
      const data = await refine.run<{ phase: RoadmapPhase }>("rewriteStep", {
        goal: roadmap.goal,
        level: roadmap.level,
        phases: phasesRef.current,
        phaseIndex: phaseIdx,
        stepId: step.id,
        guidance: note,
      });
      const written = data.phase.steps.find((s) => s.id === step.id);
      if (!written?.description)
        throw new Error("The coach wrote nothing back.");
      const next = patchStep(phase.id, step.id, (s) => ({
        ...s,
        description: written.description,
        successCriteria: written.successCriteria,
        sessionsRequired: written.sessionsRequired,
      }));
      await saveContent(next);
      toast.success("Step rewritten.");
    } catch (error) {
      refineFailed(error);
    } finally {
      setRefineBusy(step.id, "rewriteStep", false);
      setLoadingDetailIds((prev) => withoutId(prev, step.id));
    }
  };

  const refineSwapExercise = async (ref: RoadmapStepRef, note: string) => {
    if (!refine) return;
    const { step } = ref;
    setRefineBusy(step.id, "swapExercise", true);
    try {
      const data = await refine.run<{ exerciseIds: string[] }>("swapExercise", {
        goal: roadmap.goal,
        level: roadmap.level,
        stepTitle: step.title,
        description: step.description || "",
        guidance: note,
      });
      setExerciseOptions((prev) => ({
        ...prev,
        [step.id]: data.exerciseIds ?? [],
      }));
    } catch (error) {
      refineFailed(error);
    } finally {
      setRefineBusy(step.id, "swapExercise", false);
    }
  };

  /** A different exercise means the old tick is for something else — it goes too. */
  const refineSelectExercise = (ref: RoadmapStepRef, exerciseId: string) => {
    const { step, phase } = ref;
    const next = patchStep(phase.id, step.id, (s) => ({
      ...s,
      suggestedExerciseId: exerciseId,
      noExercise: false,
      exerciseCompleted: false,
    }));
    dropExerciseOptions(step.id);
    void Promise.all([saveContent(next), persist(next)]).catch(() => {});
  };

  const refineRefreshLessons = async (ref: RoadmapStepRef) => {
    if (!refine) return;
    const { step, phase } = ref;
    setRefineBusy(step.id, "refreshLessons", true);
    try {
      const data = await refine.run<{ lessons: YouTubeLessonResult[] }>(
        "refreshLessons",
        {
          goal: roadmap.goal,
          level: roadmap.level,
          stepTitle: step.title,
          description: step.description || "",
        },
      );
      const lessons = data.lessons ?? [];
      setLessonsCache((prev) => ({ ...prev, [step.id]: lessons }));
      const next = patchStep(phase.id, step.id, (s) => ({
        ...s,
        suggestedLessonIds: lessons.map((l) => l.videoId),
        completedLessonIds: [],
      }));
      await Promise.all([saveContent(next), persist(next)]);
      toast.success(
        lessons.length
          ? `Found ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}.`
          : "No lesson in the index fits this step.",
      );
    } catch (error) {
      refineFailed(error);
    } finally {
      setRefineBusy(step.id, "refreshLessons", false);
    }
  };

  const refineFindSong = async (ref: RoadmapStepRef) => {
    if (!refine) return;
    const { step, phase } = ref;
    setRefineBusy(step.id, "findSong", true);
    try {
      const data = await refine.run<{
        requested: { title: string; artist: string } | null;
        song: RoadmapSongRef | null;
      }>("findSong", {
        goal: roadmap.goal,
        level: roadmap.level,
        stepTitle: step.title,
        description: step.description || "",
      });
      if (data.song) {
        const song = data.song;
        const next = patchStep(phase.id, step.id, (s) => ({
          ...s,
          suggestedSong: song,
          songCompleted: false,
        }));
        await Promise.all([saveContent(next), persist(next)]);
        toast.success(`Linked to "${song.title}" by ${song.artist}.`);
      } else if (data.requested) {
        toast.info(
          `"${data.requested.title}" by ${data.requested.artist} is not in the song library.`,
        );
      } else {
        toast.info("This step is not about one particular song.");
      }
    } catch (error) {
      refineFailed(error);
    } finally {
      setRefineBusy(step.id, "findSong", false);
    }
  };

  const refineAddStep = async (ref: RoadmapStepRef, note: string) => {
    if (!refine) return;
    const { step, phase, phaseIdx } = ref;
    setRefineBusy(step.id, "addSteps", true);
    try {
      const data = await refine.run<{
        phase: RoadmapPhase;
        addedStepIds: string[];
      }>("addSteps", {
        goal: roadmap.goal,
        level: roadmap.level,
        phases: phasesRef.current,
        phaseIndex: phaseIdx,
        afterStepId: step.id,
        count: 1,
        guidance: note,
      });
      const next = replacePhase(phase.id, () => data.phase);
      await saveContent(next);
      toast.success("Step added.");
      const [addedId] = data.addedStepIds ?? [];
      if (addedId) {
        setActiveStepId(addedId);
        setIsDrawerOpen(true);
        syncStepQuery(addedId);
      }
    } catch (error) {
      refineFailed(error);
    } finally {
      setRefineBusy(step.id, "addSteps", false);
    }
  };

  /** Free: nothing is asked of the coach. The drawer moves to a neighbour. */
  const refineRemoveStep = (ref: RoadmapStepRef) => {
    const { step, phase, index } = ref;
    if (phase.steps.length <= 1) {
      toast.error("A phase keeps at least one step.");
      return;
    }
    const neighbour =
      steps[index + 1]?.step.id ?? steps[index - 1]?.step.id ?? null;
    const next = replacePhase(phase.id, (p) => ({
      ...p,
      steps: p.steps
        .filter((s) => s.id !== step.id)
        .map((s, order) => ({ ...s, order })),
    }));
    void saveContent(next);
    dropExerciseOptions(step.id);
    if (neighbour) {
      setActiveStepId(neighbour);
      syncStepQuery(neighbour);
    } else {
      closeStep();
    }
    toast.success("Step removed.");
  };

  const handleRemoveLesson = (
    stepId: string,
    phaseId: string,
    videoId: string,
  ) => {
    setLessonsCache((prev) => ({
      ...prev,
      [stepId]: (prev[stepId] ?? []).filter((l) => l.videoId !== videoId),
    }));
    patchStep(phaseId, stepId, (s) => ({
      ...s,
      suggestedLessonIds: (s.suggestedLessonIds ?? []).filter(
        (id) => id !== videoId,
      ),
    }));
  };

  const handleAddCustomLesson = async (
    stepId: string,
    phaseId: string,
    url: string,
  ) => {
    const videoId = parseYouTubeId(url.trim());
    if (!videoId) {
      toast.error("Invalid YouTube URL.");
      return;
    }
    if (lessonsCache[stepId]?.some((l) => l.videoId === videoId)) {
      toast.info("This video is already in the list.");
      return;
    }
    setAddingCustomLesson((prev) => withId(prev, stepId));
    try {
      const oEmbed = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      ).then((r) => r.json());
      const lesson: YouTubeLessonResult = {
        videoId,
        title: oEmbed.title ?? videoId,
        channelName: oEmbed.author_name ?? "",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: 0,
        score: 0,
      };
      setLessonsCache((prev) => ({
        ...prev,
        [stepId]: [...(prev[stepId] ?? []), lesson],
      }));
      patchStep(phaseId, stepId, (s) => ({
        ...s,
        suggestedLessonIds: [...(s.suggestedLessonIds ?? []), videoId],
      }));
      setCustomLessonInput((prev) => ({ ...prev, [stepId]: "" }));
    } catch {
      toast.error("Could not fetch video info. Check the URL and try again.");
    } finally {
      setAddingCustomLesson((prev) => withoutId(prev, stepId));
    }
  };

  /** Runs `work` over `items` three at a time, with a progress bar on the map. */
  const runBatch = async <T,>(
    label: string,
    color: string,
    items: T[],
    work: (item: T) => Promise<void>,
  ) => {
    setBatch({ label, color, done: 0, total: items.length });
    for (let i = 0; i < items.length; i += 3) {
      await Promise.all(
        items.slice(i, i + 3).map(async (item) => {
          try {
            await work(item);
          } catch (err) {
            console.warn(`${label} error:`, err);
          } finally {
            setBatch((prev) =>
              prev ? { ...prev, done: prev.done + 1 } : prev,
            );
          }
        }),
      );
    }
    setBatch(null);
  };

  const handleGenerateAll = async () => {
    const toGenerate = flattenRoadmapSteps(phasesRef.current).filter(
      (r) => !r.step.description && !detailInFlight.current.has(r.step.id),
    );
    if (!toGenerate.length) {
      toast.info("All steps already have descriptions.");
      return;
    }
    await runBatch(
      "Generating descriptions",
      "bg-cyan-500",
      toGenerate,
      async (ref) => {
        detailInFlight.current.add(ref.step.id);
        setLoadingDetailIds((prev) => withId(prev, ref.step.id));
        try {
          const data = await fetchStepDetail(
            roadmap,
            ref,
            phasesRef.current,
            adminPassword,
          );
          patchStep(ref.phase.id, ref.step.id, (s) => enrichStep(s, data));
        } finally {
          detailInFlight.current.delete(ref.step.id);
          setLoadingDetailIds((prev) => withoutId(prev, ref.step.id));
        }
      },
    );
    toast.success("All descriptions generated.");
  };

  const handleFindAllExercises = async () => {
    const toFind = flattenRoadmapSteps(phasesRef.current).filter(
      (r) => !r.step.suggestedExerciseId && !r.step.noExercise,
    );
    if (!toFind.length) {
      toast.info(
        "All steps already have exercises or are marked as no-exercise.",
      );
      return;
    }
    await runBatch(
      "Finding exercises",
      "bg-violet-500",
      toFind,
      async ({ step, phase }) => {
        setLoadingExerciseIds((prev) => withId(prev, step.id));
        try {
          const [firstId] = await searchExercise(roadmap, step, adminPassword);
          if (firstId)
            patchStep(phase.id, step.id, (s) => ({
              ...s,
              suggestedExerciseId: firstId,
            }));
        } finally {
          setLoadingExerciseIds((prev) => withoutId(prev, step.id));
        }
      },
    );
    toast.success("Exercise search complete.");
  };

  const handleFindAllLessons = async () => {
    const toFind = flattenRoadmapSteps(phasesRef.current).filter(
      (r) => r.step.description && !r.step.suggestedLessonIds?.length,
    );
    if (!toFind.length) {
      toast.info("All described steps already have lessons.");
      return;
    }
    await runBatch(
      "Finding lessons",
      "bg-red-500",
      toFind,
      async ({ step, phase }) => {
        const lessons = await searchLessons(roadmap, step, adminPassword);
        if (lessons.length) {
          setLessonsCache((prev) => ({ ...prev, [step.id]: lessons }));
          patchStep(phase.id, step.id, (s) => ({
            ...s,
            suggestedLessonIds: lessons.map((l) => l.videoId),
          }));
        }
      },
    );
    toast.success("Lesson search complete.");
  };

  // ─── Drawer wiring ─────────────────────────────────────────────────────────

  const drawerView = useMemo<StepDrawerView | null>(() => {
    if (!activeStep) return null;
    const id = activeStep.step.id;
    const detailFailed = detailFailedIds.has(id);
    return {
      current: activeStep,
      prev: activeStep.index > 0 ? steps[activeStep.index - 1] : null,
      next:
        activeStep.index < steps.length - 1
          ? steps[activeStep.index + 1]
          : null,
      lessons: lessonsCache[id] ?? [],
      isGenerating: !activeStep.step.description && !detailFailed,
      detailFailed,
      loadingLessons: adminMode
        ? loadingLessonIds.has(id)
        : lessonsCache[id] === undefined,
      loadingExercise: loadingExerciseIds.has(id),
    };
  }, [
    activeStep,
    steps,
    lessonsCache,
    detailFailedIds,
    adminMode,
    loadingLessonIds,
    loadingExerciseIds,
  ]);

  const adminProps: StepDrawerAdminProps | undefined =
    adminMode && activeStep
      ? {
          exerciseOptions: exerciseOptions[activeStep.step.id],
          loadingSong: loadingSongIds.has(activeStep.step.id),
          addingCustomLesson: addingCustomLesson.has(activeStep.step.id),
          customLessonInput: customLessonInput[activeStep.step.id] ?? "",
          onCustomLessonInputChange: (value) =>
            setCustomLessonInput((prev) => ({
              ...prev,
              [activeStep.step.id]: value,
            })),
          onEditStep: handleEditStep,
          onFindExercises: handleFindExercises,
          onSelectExercise: handleSelectExercise,
          onFindLessons: handleFindLessons,
          onFindSong: handleFindSong,
          onRemoveSong: handleRemoveSong,
          onRemoveLesson: handleRemoveLesson,
          onAddCustomLesson: handleAddCustomLesson,
          onRegenerate: handleRegenerateStep,
        }
      : undefined;

  const markerId = `arr-${roadmap.id.slice(0, 8)}`;
  const isFinished = progress === 100 && passedCheckpoints === phases.length;
  // A finished phase's checkpoint comes before the next phase's first step.
  const checkpointUpNext =
    nextCheckpoint && (!upNext || nextCheckpoint.phaseIdx < upNext.phaseIdx)
      ? nextCheckpoint
      : null;
  const totalSteps = steps.length;
  const hasStarted = doneCount > 0 || inProgressCount > 0;
  const isStepLoading = (step: RoadmapStep) =>
    loadingDetailIds.has(step.id) ||
    isRefineBusy(refineBusyIds[step.id]) ||
    (step.id === activeStepId && !!drawerView?.isGenerating);
  const anyRefineBusy = Object.values(refineBusyIds).some(isRefineBusy);

  /**
   * A step's node, with the owner's refining wand beside it in refine mode.
   * The wand sits on the outer side, away from the phase the arrows come
   * from, so the connector still lands on the node itself.
   */
  const renderStep = (
    step: RoadmapStep,
    textAlign: "left" | "right",
    fullWidth: boolean,
  ) => {
    const node = (
      <StepMapButton
        key={step.id}
        step={step}
        isActive={isDrawerOpen && activeStepId === step.id}
        isLoading={isStepLoading(step)}
        textAlign={textAlign}
        fullWidth={fullWidth}
        connector={!fullWidth}
        onClick={() => navigateStep(step.id)}
      />
    );
    const ref = refine ? findRoadmapStep(steps, step.id) : null;
    if (!refine || !ref) return node;
    const menu = (
      <StepRefineMenu
        stepRef={ref}
        costs={refine.costs}
        tokensLeft={refine.tokensLeft}
        busy={refineBusyIds[step.id] ?? {}}
        anyBusy={anyRefineBusy}
        exerciseOptions={exerciseOptions[step.id]}
        side={textAlign === "right" ? "left" : "right"}
        onRewrite={refineRewrite}
        onSwapExercise={refineSwapExercise}
        onSelectExercise={refineSelectExercise}
        onDismissExerciseOptions={(target) =>
          dropExerciseOptions(target.step.id)
        }
        onRefreshLessons={refineRefreshLessons}
        onFindSong={refineFindSong}
        onAddStep={refineAddStep}
        onRemoveStep={refineRemoveStep}
      />
    );
    return (
      <div
        key={step.id}
        className={cn(
          "flex items-center gap-1.5",
          fullWidth ? "w-full" : "max-w-[300px]",
        )}>
        {textAlign === "right" && menu}
        {node}
        {textAlign === "left" && menu}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className='overflow-hidden rounded-lg bg-zinc-950'>
        {/* ─── Hero header ─── */}
        {roadmap.image ? (
          <div className='relative h-48 w-full overflow-hidden md:h-56'>
            <img
              src={roadmap.image}
              alt={roadmap.title}
              className='absolute inset-0 h-full w-full object-cover'
              style={{ filter: "grayscale(50%) saturate(0.7)" }}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30' />
            <div className='absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent' />

            <div className='absolute inset-0 flex flex-col justify-end px-6 pb-5 md:px-8'>
              <div className='mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400'>
                {roadmap.level && (
                  <span className='rounded bg-zinc-800/80 px-2 py-0.5 backdrop-blur-sm'>
                    {roadmap.level}
                  </span>
                )}
                <span className='text-zinc-600'>·</span>
                <span>{totalSteps} steps</span>
                <span className='text-zinc-600'>·</span>
                <span>{phases.length} phases</span>
              </div>
              <h2 className='font-display text-xl font-bold text-zinc-100 md:text-2xl'>
                {roadmap.title}
              </h2>
              <div className='mt-3 flex items-center gap-3'>
                <div className='h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/80'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className='shrink-0 text-xs font-semibold tabular-nums text-emerald-400'>
                  {doneCount}/{totalSteps}
                  {inProgressCount > 0 && (
                    <span className='ml-1.5 text-amber-400'>
                      · {inProgressCount} in progress
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className='px-5 pt-5 md:px-8 md:pt-8'>
            <div className='mb-5 flex flex-col gap-1'>
              <h2 className='font-display text-xl font-bold text-zinc-100'>
                {roadmap.title}
              </h2>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400'>
                <span className='flex items-center gap-1.5'>
                  <Zap className='h-4 w-4 text-emerald-500' />
                  <span className='font-semibold text-emerald-500'>
                    {progress}%
                  </span>
                </span>
                <span className='text-zinc-700'>·</span>
                <span>
                  {doneCount}/{totalSteps} steps
                </span>
                {inProgressCount > 0 && (
                  <>
                    <span className='text-zinc-700'>·</span>
                    <span className='text-amber-400'>
                      {inProgressCount} in progress
                    </span>
                  </>
                )}
                {roadmap.level && (
                  <>
                    <span className='text-zinc-700'>·</span>
                    <span className='rounded bg-zinc-800 px-2 py-0.5 text-xs'>
                      {roadmap.level}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className='h-1 w-full overflow-hidden rounded-full bg-zinc-800'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className='p-5 md:p-8'>
          <div className='relative z-[1]'>
            {/* ─── Admin: batch action bar ─── */}
            {adminMode && (
              <div className='mb-5 rounded-lg bg-zinc-900/40 px-4 py-3'>
                {batch ? (
                  <div className='flex items-center gap-3'>
                    <Loader2 className='h-4 w-4 shrink-0 animate-spin text-zinc-400' />
                    <span className='text-xs text-zinc-400'>
                      {batch.label} {batch.done}/{batch.total}…
                    </span>
                    <div className='ml-auto h-1 w-32 overflow-hidden rounded-full bg-zinc-800'>
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          batch.color,
                        )}
                        style={{
                          width: `${batch.total ? (batch.done / batch.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col gap-2.5'>
                    <div className='flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500'>
                      <span>
                        <span className='text-zinc-300'>
                          {steps.filter((r) => r.step.description).length}
                        </span>
                        /{totalSteps} described
                      </span>
                      <span>
                        <span className='text-zinc-300'>
                          {
                            steps.filter(
                              (r) =>
                                r.step.suggestedExerciseId || r.step.noExercise,
                            ).length
                          }
                        </span>
                        /{totalSteps} exercises
                      </span>
                      <span>
                        <span className='text-zinc-300'>
                          {
                            steps.filter(
                              (r) => r.step.suggestedLessonIds?.length,
                            ).length
                          }
                        </span>
                        /{totalSteps} lessons
                      </span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <button
                        type='button'
                        onClick={handleGenerateAll}
                        className='flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-cyan-300'>
                        <Sparkles className='h-3.5 w-3.5' /> All descriptions
                      </button>
                      <button
                        type='button'
                        onClick={handleFindAllExercises}
                        className='flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-violet-300'>
                        <Dumbbell className='h-3.5 w-3.5' /> All exercises
                      </button>
                      <button
                        type='button'
                        onClick={handleFindAllLessons}
                        className='flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-red-300'>
                        <FaYoutube className='h-3.5 w-3.5' /> All lessons
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Up next + legend ─── */}
            <div className='mb-8 flex flex-col gap-3 md:flex-row md:items-stretch'>
              {checkpointUpNext ? (
                <button
                  type='button'
                  onClick={() => openCheckpoint(checkpointUpNext.phase.id)}
                  className='group flex min-w-0 flex-1 items-center gap-4 rounded-lg bg-amber-500/10 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-amber-500/15'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
                    <ClipboardCheck className='h-4 w-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-[11px] font-semibold text-amber-400'>
                      Checkpoint
                    </span>
                    <span className='block truncate text-sm font-semibold text-zinc-100'>
                      Show what you learned in phase{" "}
                      {checkpointUpNext.phaseIdx + 1}
                    </span>
                    <span className='block truncate text-xs text-zinc-400'>
                      {checkpointUpNext.phase.title} · every step done
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-amber-500 transition-colors group-hover:text-amber-300' />
                </button>
              ) : upNext ? (
                <button
                  type='button'
                  onClick={() => openStep(upNext)}
                  className='group flex min-w-0 flex-1 items-center gap-4 rounded-lg bg-cyan-500/10 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-cyan-500/15'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                    <Play className='h-4 w-4' fill='currentColor' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-[11px] font-semibold text-cyan-400'>
                      {hasStarted ? "Continue" : "Start here"}
                    </span>
                    <span className='block truncate text-sm font-semibold text-zinc-100'>
                      {upNext.step.title}
                    </span>
                    <span className='block truncate text-xs text-zinc-400'>
                      Phase {upNext.phaseIdx + 1} · {upNext.phase.title}
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-cyan-500 transition-colors group-hover:text-cyan-300' />
                </button>
              ) : (
                <div className='flex flex-1 items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400'>
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  Every step done and every checkpoint passed. Your reward is
                  waiting at the finish line.
                </div>
              )}

              <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400 md:shrink-0'>
                {LEGEND.map(({ status, label }) => (
                  <span key={status} className='flex items-center gap-1.5'>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[status],
                      )}
                    />
                    {label}
                  </span>
                ))}
                {refine && (
                  <span className='flex items-center gap-1.5 text-zinc-300'>
                    <Coins className='h-3.5 w-3.5 text-amber-300' />
                    {refine.tokensLeft === null ? (
                      "tokens"
                    ) : (
                      <>
                        <span className='font-bold tabular-nums'>
                          {refine.tokensLeft}
                        </span>{" "}
                        tokens
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* ─── Graph ─── */}
            <div ref={containerRef} className='relative'>
              {svgDims.w > 0 && (
                <svg
                  className='pointer-events-none absolute left-0 top-0 hidden overflow-visible sm:block'
                  width={svgDims.w}
                  height={svgDims.h}
                  style={{ zIndex: 0 }}>
                  <defs>
                    {LEGEND.map(({ status }) => (
                      <marker
                        key={status}
                        id={`${markerId}-${status}`}
                        markerWidth='5'
                        markerHeight='4'
                        refX='5'
                        refY='2'
                        orient='auto'>
                        <polygon
                          points='0 0, 5 2, 0 4'
                          fill={PATH_COLOR[status]}
                        />
                      </marker>
                    ))}
                  </defs>
                  {svgPaths.map((path) => (
                    <path
                      key={path.key}
                      d={path.d}
                      stroke={PATH_COLOR[path.status]}
                      strokeWidth='2'
                      fill='none'
                      strokeDasharray='5 3'
                      markerEnd={`url(#${markerId}-${path.status})`}
                      opacity='0.8'
                    />
                  ))}
                </svg>
              )}

              <div
                className='relative flex flex-col items-center'
                style={{ zIndex: 1 }}>
                {/* Root node */}
                <div className='max-w-sm rounded-lg bg-zinc-800/90 px-8 py-4 text-center text-sm font-bold text-zinc-100'>
                  {roadmap.title}
                </div>

                <div className='relative w-full'>
                  <div className='absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-zinc-800 sm:block' />
                  <div
                    className='absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-emerald-600/50 transition-all duration-700 sm:block'
                    style={{ height: `${progress}%` }}
                  />

                  {phases.map((phase, phaseIdx) => {
                    const stepsRight = phaseIdx % 2 === 0;
                    const phaseAllDone = isPhaseCleared(phase);
                    const phaseDone = phase.steps.filter(
                      (s) => getStepStatus(s) === "done",
                    ).length;
                    const columnSteps = (textAlign: "left" | "right") => (
                      <>
                        {phase.steps.map((step) =>
                          renderStep(step, textAlign, false),
                        )}
                        <CheckpointMapButton
                          phase={phase}
                          isActive={
                            isCheckOpen && activeCheckPhaseId === phase.id
                          }
                          textAlign={textAlign}
                          connector
                          onClick={() => openCheckpoint(phase.id)}
                        />
                      </>
                    );

                    return (
                      <div
                        key={phase.id}
                        className='flex w-full flex-col py-6 sm:items-center sm:py-10'>
                        {/* ── Mobile ── */}
                        <div className='flex w-full flex-col gap-3 sm:hidden'>
                          <div className='flex items-center gap-2.5'>
                            <PhaseBadge
                              phaseIdx={phaseIdx}
                              allDone={phaseAllDone}
                            />
                            <span className='text-sm font-semibold text-zinc-200'>
                              {phase.title}
                            </span>
                            {!phaseAllDone && (
                              <span className='ml-auto shrink-0 text-[11px] font-medium tabular-nums text-zinc-400'>
                                {phaseDone}/{phase.steps.length}
                              </span>
                            )}
                          </div>
                          <div className='ml-4 flex flex-col gap-3 pl-4'>
                            {phase.steps.map((step) =>
                              renderStep(step, "left", true),
                            )}
                            <CheckpointMapButton
                              phase={phase}
                              isActive={
                                isCheckOpen && activeCheckPhaseId === phase.id
                              }
                              textAlign='left'
                              fullWidth
                              onClick={() => openCheckpoint(phase.id)}
                            />
                          </div>
                        </div>

                        {/* ── Desktop ── */}
                        <div className='hidden w-full sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-x-24 md:gap-x-40'>
                          <div className='flex flex-col items-end gap-5'>
                            {!stepsRight && columnSteps("right")}
                          </div>

                          <div
                            data-phase-id={phase.id}
                            className='relative z-10 flex shrink-0 items-center gap-2.5 whitespace-nowrap bg-zinc-950 py-1 pl-1 pr-3'>
                            <PhaseBadge
                              phaseIdx={phaseIdx}
                              allDone={phaseAllDone}
                            />
                            <span className='text-sm font-semibold text-zinc-200'>
                              {phase.title}
                            </span>
                            {!phaseAllDone && (
                              <span className='text-[11px] font-medium tabular-nums text-zinc-400'>
                                {phaseDone}/{phase.steps.length}
                              </span>
                            )}
                          </div>

                          <div className='flex flex-col items-start gap-5'>
                            {stepsRight && columnSteps("left")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Finish node — the reward card on the authored roadmaps, whose
                    steps ship in the repo and can therefore be paid for; the plain
                    plate on a roadmap the player generated for themselves. */}
                {phases.length > 0 &&
                  (isRewardableRoadmap(roadmap.id) ? (
                    <RoadmapFinishCard
                      roadmapId={roadmap.id}
                      done={doneCount}
                      total={totalSteps}
                      checkpointsLeft={phases.length - passedCheckpoints}
                    />
                  ) : (
                    <div
                      className={cn(
                        "rounded-lg px-8 py-4 text-center text-sm font-semibold transition-all duration-700",
                        isFinished
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-900/30 text-zinc-500 opacity-40",
                      )}>
                      {isFinished ? "🏆 Goal achieved!" : "🏆 Finish"}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PhaseCheckDrawer
        open={isCheckOpen}
        phase={activeCheck?.phase ?? null}
        phaseIdx={activeCheck?.phaseIdx ?? 0}
        roadmapId={roadmap.id}
        adminPassword={adminMode ? adminPassword : undefined}
        readOnly={readOnly}
        onClose={closeCheckpoint}
        onResult={handleCheckResult}
      />

      <StepDrawer
        open={isDrawerOpen}
        view={drawerView}
        navigationLocked={!!practiceLesson}
        onClose={closeStep}
        onNavigate={navigateStep}
        onSetStatus={handleSetStatus}
        onRetryDetail={handleRetryDetail}
        onOpenExercise={handleOpenExercise}
        onToggleExercise={handleToggleExercise}
        onOpenSong={handleOpenSong}
        onToggleSong={handleToggleSong}
        onToggleLesson={handleToggleLesson}
        onPracticeLesson={(lesson) => {
          if (activeStep) {
            setPracticeLesson({
              lesson,
              stepId: activeStep.step.id,
              phaseId: activeStep.phase.id,
            });
          }
        }}
        admin={adminProps}
      />

      {practiceLesson && (
        <LessonPracticeModal
          lesson={practiceLesson.lesson}
          onFinish={() => {
            markLessonWatched(
              practiceLesson.phaseId,
              practiceLesson.stepId,
              practiceLesson.lesson.videoId,
            );
            setPracticeLesson(null);
          }}
          onClose={() => setPracticeLesson(null)}
        />
      )}
    </>
  );
};

export default RoadmapView;
