import { Button, PRESSABLE } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Dumbbell,
  Loader2,
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
import {
  countPassedCheckpoints,
  getNextCheckpoint,
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
import {
  RoadmapCheckpointBubble,
  RoadmapStepBubble,
} from "./components/RoadmapBubbles";
import { RoadmapFinishCard } from "./components/RoadmapFinishCard";
import { checkpointStopId, RoadmapRoad } from "./components/RoadmapRoad";
import { RoadmapStepLesson } from "./components/RoadmapStepLesson";
import type {
  StepDrawerAdminProps,
  StepDrawerView,
} from "./components/StepDrawer";
import { StepDrawer } from "./components/StepDrawer";
import type { RefineBusy } from "./components/StepRefineMenu";
import { isRefineBusy, StepRefineMenu } from "./components/StepRefineMenu";

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
 * The roadmap as one winding road, the way Journey draws a module (owner's
 * call, 2026-11-22): every step a stop, each phase's checkpoint after its
 * steps, the reward at the end. A tap opens the stop's bubble under it; the
 * lesson opens on the full screen, page by page, and ends on the step's kit
 * and the way to the next step. The admin editor keeps its side drawer. The
 * open lesson also lives in the URL (`?step=`), so a refresh, or coming back
 * from the exercise page, lands in the same place.
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
  const { t } = useTranslation("ai_coach");
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
  // Open = the step's lesson on the full screen (the editor's drawer in admin
  // mode). Closing it leaves the step's bubble open on the road.
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => activeStepId !== null);
  // The stop whose bubble is open on the road: a step id or a checkpoint's.
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    () => activeStepId,
  );
  // The bubble's "Materials" opens the lesson on its last page, the kit.
  const [lessonAtEnd, setLessonAtEnd] = useState(false);

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
        toast.error(t("toasts.save_failed")),
      );
    },
    [patchStep, persist, t],
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
    (ref: RoadmapStepRef, options?: { atEnd?: boolean }) => {
      setActiveStepId(ref.step.id);
      setSelectedStopId(ref.step.id);
      setLessonAtEnd(!!options?.atEnd);
      setIsDrawerOpen(true);
      syncStepQuery(ref.step.id);
    },
    [syncStepQuery],
  );

  const closeStep = useCallback(() => {
    setIsDrawerOpen(false);
    syncStepQuery(null);
  }, [syncStepQuery]);

  /**
   * A tap on the road: opens that stop's bubble, or folds it again. A step
   * becomes the active one at once, so its lessons load while the bubble is up.
   * The editor skips the bubble and goes straight to its drawer.
   */
  const selectStop = (stopId: string) => {
    const ref = findRoadmapStep(steps, stopId);
    if (ref && adminMode) {
      openStep(ref);
      return;
    }
    if (selectedStopId === stopId) {
      setSelectedStopId(null);
      return;
    }
    setSelectedStopId(stopId);
    if (ref) setActiveStepId(ref.step.id);
  };

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
      persist(next).catch(() => toast.error(t("toasts.save_failed")));
    },
    [onUpdate, persist, roadmap, t],
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
        // The editor is admin-only, so this one stays in English.
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
      error instanceof Error ? error.message : t("toasts.change_failed"),
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
      toast.success(t("toasts.step_rewritten"));
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
          ? t("toasts.lessons_found", { count: lessons.length })
          : t("toasts.no_lesson"),
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
        toast.success(
          t("toasts.song_linked", { title: song.title, artist: song.artist }),
        );
      } else if (data.requested) {
        toast.info(
          t("toasts.song_missing", {
            title: data.requested.title,
            artist: data.requested.artist,
          }),
        );
      } else {
        toast.info(t("toasts.no_song"));
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
      toast.success(t("toasts.step_added"));
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
      toast.error(t("toasts.phase_min"));
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
    toast.success(t("toasts.step_removed"));
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

  const isFinished = progress === 100 && passedCheckpoints === phases.length;
  // A finished phase's checkpoint comes before the next phase's first step.
  const checkpointUpNext =
    nextCheckpoint && (!upNext || nextCheckpoint.phaseIdx < upNext.phaseIdx)
      ? nextCheckpoint
      : null;
  const totalSteps = steps.length;
  const hasStarted = doneCount > 0 || inProgressCount > 0;
  const anyRefineBusy = Object.values(refineBusyIds).some(isRefineBusy);

  /** The owner's refining wand, in the corner of a step's bubble in refine mode. */
  const refineMenuFor = (ref: RoadmapStepRef) =>
    refine ? (
      <StepRefineMenu
        stepRef={ref}
        costs={refine.costs}
        tokensLeft={refine.tokensLeft}
        busy={refineBusyIds[ref.step.id] ?? {}}
        anyBusy={anyRefineBusy}
        exerciseOptions={exerciseOptions[ref.step.id]}
        side='left'
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
    ) : undefined;

  // A step still being written shows a spinner on its stop — in the editor,
  // where the coach writes it. A player's blank step just reads as blank.
  const isStopLoading = (stepId: string) =>
    loadingDetailIds.has(stepId) ||
    isRefineBusy(refineBusyIds[stepId]) ||
    (adminMode && stepId === activeStepId && !!drawerView?.isGenerating);

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
                    {t(`levels.${roadmap.level}`, roadmap.level)}
                  </span>
                )}
                <span className='text-zinc-600'>·</span>
                <span>{t("n_steps", { count: totalSteps })}</span>
                <span className='text-zinc-600'>·</span>
                <span>{t("n_phases", { count: phases.length })}</span>
              </div>
              <h2 className='font-display text-xl font-bold text-zinc-100 md:text-2xl'>
                {roadmap.title}
              </h2>
              <div className='mt-3 flex items-center gap-3'>
                <div className='h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/80'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all duration-slow'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className='shrink-0 text-xs font-semibold tabular-nums text-emerald-400'>
                  {doneCount}/{totalSteps}
                  {inProgressCount > 0 && (
                    <span className='ml-1.5 text-amber-400'>
                      · {t("in_progress_count", { count: inProgressCount })}
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
                  {t("steps_of", { done: doneCount, total: totalSteps })}
                </span>
                {inProgressCount > 0 && (
                  <>
                    <span className='text-zinc-700'>·</span>
                    <span className='text-amber-400'>
                      {t("in_progress_count", { count: inProgressCount })}
                    </span>
                  </>
                )}
                {roadmap.level && (
                  <>
                    <span className='text-zinc-700'>·</span>
                    <Chip color='gray' size='sm'>
                      {t(`levels.${roadmap.level}`, roadmap.level)}
                    </Chip>
                  </>
                )}
              </div>
            </div>
            <div className='h-1 w-full overflow-hidden rounded-full bg-zinc-800'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-slow'
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
                          "h-full rounded-full transition-all duration-base",
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
                      <Button
                        type='button'
                        variant='subtle'
                        size='sm'
                        onClick={handleGenerateAll}>
                        <Sparkles /> All descriptions
                      </Button>
                      <Button
                        type='button'
                        variant='subtle'
                        size='sm'
                        onClick={handleFindAllExercises}>
                        <Dumbbell /> All exercises
                      </Button>
                      <Button
                        type='button'
                        variant='subtle'
                        size='sm'
                        onClick={handleFindAllLessons}>
                        <FaYoutube /> All lessons
                      </Button>
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
                  className={cn(
                    PRESSABLE,
                    "group flex min-w-0 flex-1 items-center gap-4 rounded-lg border-b-black/30 bg-amber-500/10 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-amber-500/15",
                  )}>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
                    <ClipboardCheck className='h-4 w-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-[11px] font-semibold text-amber-400'>
                      {t("checkpoint.locked")}
                    </span>
                    <span className='block truncate text-sm font-semibold text-zinc-100'>
                      {t("checkpoint.show_what", {
                        phase: checkpointUpNext.phaseIdx + 1,
                      })}
                    </span>
                    <span className='block truncate text-xs text-zinc-400'>
                      {checkpointUpNext.phase.title} ·{" "}
                      {t("checkpoint.every_step_done")}
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-amber-500 transition-colors group-hover:text-amber-300' />
                </button>
              ) : upNext ? (
                <button
                  type='button'
                  onClick={() => openStep(upNext)}
                  className={cn(
                    PRESSABLE,
                    "group flex min-w-0 flex-1 items-center gap-4 rounded-lg border-b-black/30 bg-cyan-500/10 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-cyan-500/15",
                  )}>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                    <Play className='h-4 w-4' fill='currentColor' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-[11px] font-semibold text-cyan-400'>
                      {hasStarted ? t("card.continue") : t("start_here")}
                    </span>
                    <span className='block truncate text-sm font-semibold text-zinc-100'>
                      {upNext.step.title}
                    </span>
                    <span className='block truncate text-xs text-zinc-400'>
                      {t("phase_n", { n: upNext.phaseIdx + 1 })} ·{" "}
                      {upNext.phase.title}
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-cyan-500 transition-colors group-hover:text-cyan-300' />
                </button>
              ) : (
                <div className='flex flex-1 items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400'>
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  {t("all_done_banner")}
                </div>
              )}

              {refine && (
              <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400 md:shrink-0'>
                  <span className='flex items-center gap-1.5 text-zinc-300'>
                    <Coins className='h-3.5 w-3.5 text-amber-300' />
                    {refine.tokensLeft === null ? (
                      t("tokens")
                    ) : (
                      <Interpolate
                        text={t("tokens_count", { count: refine.tokensLeft })}
                        values={{
                          count: (
                            <span className='font-bold tabular-nums'>
                              {refine.tokensLeft}
                            </span>
                          ),
                        }}
                      />
                    )}
                  </span>
              </div>
              )}
            </div>

            {/* ─── The road ─── */}
            <RoadmapRoad
              phases={phases}
              steps={steps}
              selectedId={selectedStopId}
              upNextId={
                checkpointUpNext
                  ? checkpointStopId(checkpointUpNext.phase.id)
                  : (upNext?.step.id ?? null)
              }
              hasStarted={hasStarted}
              isStepLoading={isStopLoading}
              onSelect={selectStop}
              renderStepBubble={(ref, pointerOffset) => (
                <RoadmapStepBubble
                  stepRef={ref}
                  pointerOffset={pointerOffset}
                  lessons={lessonsCache[ref.step.id] ?? []}
                  onOpenLesson={() => openStep(ref)}
                  onOpenMaterials={() => openStep(ref, { atEnd: true })}
                  onPractice={handleOpenExercise}
                  onPlaySong={handleOpenSong}
                  refineMenu={refineMenuFor(ref)}
                />
              )}
              renderCheckpointBubble={(phase, phaseIdx, pointerOffset) => (
                <RoadmapCheckpointBubble
                  phase={phase}
                  phaseIdx={phaseIdx}
                  pointerOffset={pointerOffset}
                  onOpen={() => openCheckpoint(phase.id)}
                />
              )}
              footer={
                <>
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
                        "rounded-lg px-8 py-4 text-center text-sm font-semibold transition-all duration-slow",
                        isFinished
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-900/30 text-zinc-500 opacity-40",
                      )}>
                      {isFinished
                        ? `🏆 ${t("goal_achieved")}`
                        : `🏆 ${t("finish")}`}
                    </div>
                  ))}
                </>
              }
            />
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

      {adminMode ? (
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
      ) : (
        <RoadmapStepLesson
          open={isDrawerOpen}
          view={drawerView}
          startAtEnd={lessonAtEnd}
          onClose={closeStep}
          onNextStep={navigateStep}
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
        />
      )}

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
