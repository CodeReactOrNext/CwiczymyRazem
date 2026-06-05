import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { Check, ChevronRight, Dumbbell, Loader2, Map as MapIcon, RefreshCw, Sparkles, Target, X, Zap } from "lucide-react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";

import { firebaseUpdateRoadmap } from "../../services/roadmap.service";
import { firebaseGetLessonsByIds } from "../../services/youtubeLesson.service";
import type { Roadmap, RoadmapPhase, RoadmapStep } from "../../types/roadmap.types";
import type { YouTubeLessonResult } from "../../types/youtubeLesson.types";
import YouTubeLessonCard from "./components/YouTubeLessonCard";

// ─── AI Generating Loader ───────────────────────────────────────────────────

const AI_MESSAGES = [
  "Analyzing your learning goal...",
  "Identifying key techniques...",
  "Writing practice exercises...",
  "Calibrating difficulty to your level...",
  "Setting success criteria...",
  "Almost there...",
];

const AiGeneratingLoader: React.FC<{ stepTitle: string }> = ({ stepTitle }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % AI_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-16 w-16 animate-ping rounded-full bg-cyan-500/10" />
          <span className="absolute h-12 w-12 animate-pulse rounded-full bg-cyan-500/15" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
            <MapIcon className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[11px] font-semibold capitalize tracking-widest text-cyan-500/70">
            Roadmap is thinking
          </p>
          <p
            className="text-sm text-zinc-400 transition-opacity duration-300"
            style={{ opacity: fade ? 1 : 0 }}
          >
            {AI_MESSAGES[msgIdx]}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-cyan-500/60"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-zinc-900/50 px-4 py-3">
        <p className="mb-1 text-[10px] font-semibold capitalize tracking-widest text-zinc-600">
          Generating details for
        </p>
        <p className="text-sm font-medium text-zinc-300">{stepTitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {[92, 100, 78, 95, 65, 88].map((w, i) => (
          <div key={i} className="h-3 overflow-hidden rounded-full bg-zinc-800/60" style={{ width: `${w}%` }}>
            <div
              className="h-full w-full rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.12) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.8s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────

type StepStatus = "not-started" | "in-progress" | "done";

function getStatus(step: RoadmapStep): StepStatus {
  if (step.sessionsCompleted >= step.sessionsRequired) return "done";
  if (step.sessionsCompleted > 0) return "in-progress";
  return "not-started";
}

const STEP_CLS: Record<StepStatus, string> = {
  "not-started": "bg-zinc-900 text-zinc-300 hover:bg-zinc-800/80",
  "in-progress": "bg-amber-500/10 text-amber-200",
  done: "bg-cyan-950/30 text-zinc-500",
};

const STATUS_DOT: Record<StepStatus, string> = {
  "not-started": "bg-zinc-600",
  "in-progress": "bg-amber-400",
  done: "bg-cyan-500",
};

const STATUS_LABEL: Record<StepStatus, string> = {
  "not-started": "To do",
  "in-progress": "In progress",
  done: "Done",
};

const STATUS_BTNS: { status: StepStatus; label: string }[] = [
  { status: "not-started", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "done", label: "✓ Done" },
];

const PATH_COLOR: Record<StepStatus, string> = {
  "not-started": "#3f3f46",
  "in-progress": "#78350f",
  done: "#164E63",
};

const PHASE_COLORS = [
  { badge: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30" },
  { badge: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30" },
  { badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30" },
  { badge: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30" },
  { badge: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30" },
  { badge: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30" },
];

interface SvgPath {
  d: string;
  key: string;
  status: StepStatus;
}

interface RoadmapViewProps {
  roadmap: Roadmap;
  onDelete: () => void;
  onUpdate?: (roadmap: Roadmap) => void;
  onPersist?: (phases: RoadmapPhase[]) => Promise<void>;
  adminMode?: boolean;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onUpdate, onPersist, adminMode }) => {
  const persist = useCallback(
    async (phases: RoadmapPhase[]) => {
      if (onPersist) {
        await onPersist(phases);
      } else {
        await firebaseUpdateRoadmap(roadmap.id, { phases });
      }
    },
    [onPersist, roadmap.id]
  );
  const router = useRouter();
  const [phases, setPhases] = useState<RoadmapPhase[]>(roadmap.phases ?? []);
  const phasesRef = useRef(phases);
  useEffect(() => { phasesRef.current = phases; }, [phases]);

  const [drawerStepId, setDrawerStepId] = useState<string | null>(null);
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<string>>(new Set());
  const [loadingExerciseIds, setLoadingExerciseIds] = useState<Set<string>>(new Set());

  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchExercising, setBatchExercising] = useState(false);
  const [batchExerciseProgress, setBatchExerciseProgress] = useState({ done: 0, total: 0 });
  const [batchLessoning, setBatchLessoning] = useState(false);
  const [batchLessonProgress, setBatchLessonProgress] = useState({ done: 0, total: 0 });

  const [exerciseOptions, setExerciseOptions] = useState<Record<string, string[]>>({});
  const [lessonsCache, setLessonsCache] = useState<Record<string, YouTubeLessonResult[]>>({});
  const [loadingLessonsId, setLoadingLessonsId] = useState<string | null>(null);
  const [customLessonInput, setCustomLessonInput] = useState<Record<string, string>>({});
  const [addingCustomLesson, setAddingCustomLesson] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const phaseNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const stepBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [svgPaths, setSvgPaths] = useState<SvgPath[]>([]);
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    document.body.style.overflow = drawerStepId ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerStepId]);

  const drawerInfo = useMemo((): {
    step: RoadmapStep;
    phase: RoadmapPhase;
    stepIdx: number;
    phaseIdx: number;
  } | null => {
    if (!drawerStepId) return null;
    for (let pi = 0; pi < phases.length; pi++) {
      const stepIdx = phases[pi].steps.findIndex((s) => s.id === drawerStepId);
      if (stepIdx !== -1)
        return { step: phases[pi].steps[stepIdx], phase: phases[pi], stepIdx, phaseIdx: pi };
    }
    return null;
  }, [drawerStepId, phases]);

  const recalcPaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0) return;

    const newPaths: SvgPath[] = [];
    phases.forEach((phase, phaseIdx) => {
      const phaseEl = phaseNodeRefs.current.get(phase.id);
      if (!phaseEl) return;
      const pRect = phaseEl.getBoundingClientRect();
      const pCY = pRect.top + pRect.height / 2 - cRect.top;
      const pLX = pRect.left - cRect.left;
      const pRX = pRect.right - cRect.left;
      const stepsRight = phaseIdx % 2 === 0;

      phase.steps.forEach((step) => {
        const stepEl = stepBtnRefs.current.get(step.id);
        if (!stepEl) return;
        const sRect = stepEl.getBoundingClientRect();
        const sCY = sRect.top + sRect.height / 2 - cRect.top;
        const status = getStatus(step);

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
        newPaths.push({ d, key: `${phase.id}-${step.id}`, status });
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

  const allSteps = useMemo(() => phases.flatMap((p) => p.steps), [phases]);
  const doneCount = useMemo(() => allSteps.filter((s) => getStatus(s) === "done").length, [allSteps]);
  const inProgressCount = useMemo(() => allSteps.filter((s) => getStatus(s) === "in-progress").length, [allSteps]);
  const progress = allSteps.length > 0 ? Math.round((doneCount / allSteps.length) * 100) : 0;

  const openDrawer = async (step: RoadmapStep, phase: RoadmapPhase, stepIdx: number, phaseIdx: number) => {
    setDrawerStepId(step.id);

    let enrichedStep = step;
    if (!step.description && !loadingDetailIds.has(step.id)) {
      setLoadingDetailIds((prev) => new Set(prev).add(step.id));
      try {
        const res = await fetch("/api/generate-step-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: roadmap.goal,
            level: roadmap.level,
            phaseIndex: phaseIdx,
            phaseName: phase.title,
            totalPhases: phases.length,
            stepTitle: step.title,
            prevSteps: phase.steps.slice(0, stepIdx).map((s) => s.title),
            nextSteps: phase.steps.slice(stepIdx + 1).map((s) => s.title),
            allPhases: phases.map((p) => ({ title: p.title, steps: p.steps.map((s) => s.title) })),
          }),
        });
        const data = await res.json();
        enrichedStep = {
          ...step,
          description: data.description || "",
          successCriteria: data.successCriteria || "",
          sessionsRequired: Number(data.sessionsRequired) || 8,
        };
        const finalEnriched = enrichedStep;
        let savedPhases: RoadmapPhase[] = [];
        setPhases((prev) => {
          savedPhases = prev.map((p) =>
            p.id !== phase.id ? p : { ...p, steps: p.steps.map((s) => (s.id !== step.id ? s : finalEnriched)) }
          );
          return savedPhases;
        });
        onUpdate?.({ ...roadmap, phases: savedPhases, updatedAt: new Date().toISOString() });
        await persist(savedPhases);
      } catch (err) {
        console.warn("Failed to fetch step detail:", err);
      } finally {
        setLoadingDetailIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
      }
    }

    if (!adminMode && !lessonsCache[step.id] && !loadingLessonsId) {
      setLoadingLessonsId(step.id);
      const fetchLessons = async () => {
        if (enrichedStep.suggestedLessonIds?.length) {
          const firestoreLessons = await firebaseGetLessonsByIds(enrichedStep.suggestedLessonIds);
          return firestoreLessons.map((l) => ({
            videoId: l.videoId, title: l.title, channelName: l.channelName,
            thumbnailUrl: l.thumbnailUrl, duration: l.duration, level: l.level,
            topics: l.topics, score: l.qualityScore ?? 0,
          })) as YouTubeLessonResult[];
        }
        const res = await fetch("/api/search-youtube-lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepTitle: enrichedStep.title, stepDescription: enrichedStep.description || "",
            roadmapGoal: roadmap.goal, roadmapLevel: roadmap.level,
          }),
        });
        const data = await res.json();
        const lessons: YouTubeLessonResult[] = data.lessons ?? [];
        if (lessons.length > 0) {
          const lessonIds = lessons.map((l) => l.videoId);
          setPhases((prev) => {
            const newPhases = prev.map((p) =>
              p.id !== phase.id ? p : {
                ...p, steps: p.steps.map((s) => s.id !== step.id ? s : { ...s, suggestedLessonIds: lessonIds }),
              }
            );
            persist(newPhases);
            return newPhases;
          });
        }
        return lessons;
      };
      fetchLessons()
        .then((lessons) => setLessonsCache((prev) => ({ ...prev, [step.id]: lessons })))
        .catch(() => setLessonsCache((prev) => ({ ...prev, [step.id]: [] })))
        .finally(() => setLoadingLessonsId(null));
    }

    if (adminMode) return;
    if (enrichedStep.suggestedExerciseId || step.suggestedExerciseId) return;
    setLoadingExerciseIds((prev) => new Set(prev).add(step.id));
    try {
      const exRes = await fetch("/api/search-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepTitle: step.title, description: enrichedStep.description || step.description || "",
          goal: roadmap.goal, level: roadmap.level,
        }),
      });
      const exData = await exRes.json();
      const firstExId = exData.exercise_ids?.[0] ?? null;
      if (!firstExId) return;
      setPhases((prev) => {
        const phasesWithEx = prev.map((p) =>
          p.id !== phase.id ? p : {
            ...p, steps: p.steps.map((s) => s.id !== step.id ? s : { ...s, suggestedExerciseId: firstExId }),
          }
        );
        persist(phasesWithEx);
        onUpdate?.({ ...roadmap, phases: phasesWithEx, updatedAt: new Date().toISOString() });
        return phasesWithEx;
      });
    } catch (err) {
      console.warn("Failed to search exercise:", err);
    } finally {
      setLoadingExerciseIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
    }
  };

  // ─── Admin helpers ───────────────────────────────────────────────────────

  const callStepDetailApi = useCallback(
    async (step: RoadmapStep, phase: RoadmapPhase, stepIdx: number, phaseIdx: number, currentPhases: RoadmapPhase[]) => {
      const res = await fetch("/api/generate-step-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: roadmap.goal, level: roadmap.level, phaseIndex: phaseIdx,
          phaseName: phase.title, totalPhases: currentPhases.length, stepTitle: step.title,
          prevSteps: phase.steps.slice(0, stepIdx).map((s) => s.title),
          nextSteps: phase.steps.slice(stepIdx + 1).map((s) => s.title),
          allPhases: currentPhases.map((p) => ({ title: p.title, steps: p.steps.map((s) => s.title) })),
        }),
      });
      return res.json() as Promise<{ description: string; successCriteria: string; sessionsRequired: number }>;
    },
    [roadmap.goal, roadmap.level]
  );

  const applyEnrichedStep = useCallback(
    (phaseId: string, enriched: RoadmapStep) => {
      let saved: RoadmapPhase[] = [];
      setPhases((prev) => {
        saved = prev.map((p) =>
          p.id !== phaseId ? p : { ...p, steps: p.steps.map((s) => (s.id !== enriched.id ? s : enriched)) }
        );
        onUpdate?.({ ...roadmap, phases: saved, updatedAt: new Date().toISOString() });
        return saved;
      });
      return saved;
    },
    [roadmap, onUpdate]
  );

  const handleGenerateAll = async () => {
    const toGenerate: { step: RoadmapStep; phase: RoadmapPhase; stepIdx: number; phaseIdx: number }[] = [];
    phasesRef.current.forEach((phase, phaseIdx) => {
      phase.steps.forEach((step, stepIdx) => {
        if (!step.description) toGenerate.push({ step, phase, stepIdx, phaseIdx });
      });
    });
    if (!toGenerate.length) { toast.info("All steps already have descriptions."); return; }
    setBatchGenerating(true);
    setBatchProgress({ done: 0, total: toGenerate.length });
    for (let i = 0; i < toGenerate.length; i += 3) {
      const batch = toGenerate.slice(i, i + 3);
      await Promise.all(
        batch.map(async ({ step, phase, stepIdx, phaseIdx }) => {
          setLoadingDetailIds((prev) => new Set(prev).add(step.id));
          try {
            const data = await callStepDetailApi(step, phase, stepIdx, phaseIdx, phasesRef.current);
            applyEnrichedStep(phase.id, {
              ...step, description: data.description || "",
              successCriteria: data.successCriteria || "",
              sessionsRequired: Number(data.sessionsRequired) || 8,
            });
          } catch (err) {
            console.warn("Batch step detail error:", err);
          } finally {
            setLoadingDetailIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
            setBatchProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        })
      );
    }
    setBatchGenerating(false);
    toast.success("All descriptions generated.");
  };

  const handleFindAllExercises = async () => {
    const toFind = phasesRef.current.flatMap((phase) =>
      phase.steps.filter((s) => !s.suggestedExerciseId && !s.noExercise).map((s) => ({ step: s, phase }))
    );
    if (!toFind.length) { toast.info("All steps already have exercises or are marked as no-exercise."); return; }
    setBatchExercising(true);
    setBatchExerciseProgress({ done: 0, total: toFind.length });
    for (let i = 0; i < toFind.length; i += 3) {
      const batch = toFind.slice(i, i + 3);
      await Promise.all(
        batch.map(async ({ step, phase }) => {
          setLoadingExerciseIds((prev) => new Set(prev).add(step.id));
          try {
            const res = await fetch("/api/search-exercise", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stepTitle: step.title, description: step.description || "", goal: roadmap.goal, level: roadmap.level }),
            });
            const data = await res.json();
            const firstId: string | undefined = data.exercise_ids?.[0];
            if (firstId) {
              setPhases((prev) => {
                const next = prev.map((p) =>
                  p.id !== phase.id ? p : { ...p, steps: p.steps.map((s) => s.id !== step.id ? s : { ...s, suggestedExerciseId: firstId }) }
                );
                onUpdate?.({ ...roadmap, phases: next, updatedAt: new Date().toISOString() });
                return next;
              });
            }
          } catch { /* skip */ } finally {
            setLoadingExerciseIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
            setBatchExerciseProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        })
      );
    }
    setBatchExercising(false);
    toast.success("Exercise search complete.");
  };

  const handleFindAllLessons = async () => {
    const toFind = phasesRef.current.flatMap((phase) =>
      phase.steps.filter((s) => s.description && !s.suggestedLessonIds?.length).map((s) => ({ step: s, phase }))
    );
    if (!toFind.length) { toast.info("All described steps already have lessons."); return; }
    setBatchLessoning(true);
    setBatchLessonProgress({ done: 0, total: toFind.length });
    for (let i = 0; i < toFind.length; i += 3) {
      const batch = toFind.slice(i, i + 3);
      await Promise.all(
        batch.map(async ({ step, phase }) => {
          try {
            const res = await fetch("/api/search-youtube-lessons", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stepTitle: step.title, stepDescription: step.description || "", roadmapGoal: roadmap.goal, roadmapLevel: roadmap.level }),
            });
            const data = await res.json();
            const lessons: YouTubeLessonResult[] = data.lessons ?? [];
            if (lessons.length > 0) {
              setLessonsCache((prev) => ({ ...prev, [step.id]: lessons }));
              const lessonIds = lessons.map((l) => l.videoId);
              setPhases((prev) => {
                const next = prev.map((p) =>
                  p.id !== phase.id ? p : { ...p, steps: p.steps.map((s) => s.id !== step.id ? s : { ...s, suggestedLessonIds: lessonIds }) }
                );
                onUpdate?.({ ...roadmap, phases: next, updatedAt: new Date().toISOString() });
                return next;
              });
            }
          } catch { /* skip */ } finally {
            setBatchLessonProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        })
      );
    }
    setBatchLessoning(false);
    toast.success("Lesson search complete.");
  };

  const handleEditStep = useCallback(
    (stepId: string, phaseId: string, updates: Partial<RoadmapStep>) => {
      setPhases((prev) => {
        const newPhases = prev.map((p) =>
          p.id !== phaseId ? p : { ...p, steps: p.steps.map((s) => (s.id !== stepId ? s : { ...s, ...updates })) }
        );
        onUpdate?.({ ...roadmap, phases: newPhases, updatedAt: new Date().toISOString() });
        return newPhases;
      });
    },
    [roadmap, onUpdate]
  );

  const handleRegenerateStep = async (step: RoadmapStep, phase: RoadmapPhase, stepIdx: number, phaseIdx: number) => {
    applyEnrichedStep(phase.id, { ...step, description: "", successCriteria: "" });
    setLoadingDetailIds((prev) => new Set(prev).add(step.id));
    try {
      const data = await callStepDetailApi({ ...step, description: "", successCriteria: "" }, phase, stepIdx, phaseIdx, phasesRef.current);
      applyEnrichedStep(phase.id, {
        ...step, description: data.description || "",
        successCriteria: data.successCriteria || "",
        sessionsRequired: Number(data.sessionsRequired) || 8,
      });
    } catch (err) {
      console.warn("Regenerate step error:", err);
      toast.error("Failed to regenerate. Try again.");
    } finally {
      setLoadingDetailIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
    }
  };

  const handleFindExercises = async (step: RoadmapStep) => {
    setLoadingExerciseIds((prev) => new Set(prev).add(step.id));
    try {
      const res = await fetch("/api/search-exercise", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepTitle: step.title, description: step.description || "", goal: roadmap.goal, level: roadmap.level }),
      });
      const data = await res.json();
      setExerciseOptions((prev) => ({ ...prev, [step.id]: (data.exercise_ids ?? []).slice(0, 3) }));
    } catch {
      toast.error("Exercise search failed.");
    } finally {
      setLoadingExerciseIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
    }
  };

  const handleSelectExercise = (stepId: string, phaseId: string, exerciseId: string) => {
    handleEditStep(stepId, phaseId, { suggestedExerciseId: exerciseId });
    setExerciseOptions((prev) => { const n = { ...prev }; delete n[stepId]; return n; });
  };

  const handleFindLessons = async (step: RoadmapStep, phase: RoadmapPhase) => {
    if (loadingLessonsId) return;
    setLessonsCache((prev) => { const n = { ...prev }; delete n[step.id]; return n; });
    setLoadingLessonsId(step.id);
    try {
      const res = await fetch("/api/search-youtube-lessons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepTitle: step.title, stepDescription: step.description || "", roadmapGoal: roadmap.goal, roadmapLevel: roadmap.level }),
      });
      const data = await res.json();
      const lessons: YouTubeLessonResult[] = data.lessons ?? [];
      setLessonsCache((prev) => ({ ...prev, [step.id]: lessons }));
      if (lessons.length > 0) {
        handleEditStep(step.id, phase.id, { suggestedLessonIds: lessons.map((l) => l.videoId) });
      }
    } catch {
      toast.error("Lesson search failed.");
    } finally {
      setLoadingLessonsId(null);
    }
  };

  const handleRemoveLesson = (stepId: string, phaseId: string, videoId: string) => {
    setLessonsCache((prev) => ({ ...prev, [stepId]: (prev[stepId] ?? []).filter((l) => l.videoId !== videoId) }));
    handleEditStep(stepId, phaseId, {
      suggestedLessonIds: (phases.flatMap((p) => p.steps).find((s) => s.id === stepId)?.suggestedLessonIds ?? []).filter((id) => id !== videoId),
    });
  };

  const parseYouTubeId = (url: string): string | null => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  };

  const handleAddCustomLesson = async (stepId: string, phaseId: string, url: string) => {
    const videoId = parseYouTubeId(url.trim());
    if (!videoId) { toast.error("Invalid YouTube URL."); return; }
    if (lessonsCache[stepId]?.some((l) => l.videoId === videoId)) { toast.info("This video is already in the list."); return; }
    setAddingCustomLesson((prev) => new Set(prev).add(stepId));
    try {
      const oEmbed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`).then((r) => r.json());
      const lesson: YouTubeLessonResult = {
        videoId, title: oEmbed.title ?? videoId, channelName: oEmbed.author_name ?? "",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, duration: 0, score: 0,
      };
      setLessonsCache((prev) => ({ ...prev, [stepId]: [...(prev[stepId] ?? []), lesson] }));
      handleEditStep(stepId, phaseId, {
        suggestedLessonIds: [
          ...(phases.flatMap((p) => p.steps).find((s) => s.id === stepId)?.suggestedLessonIds ?? []),
          videoId,
        ],
      });
      setCustomLessonInput((prev) => ({ ...prev, [stepId]: "" }));
    } catch {
      toast.error("Could not fetch video info. Check the URL and try again.");
    } finally {
      setAddingCustomLesson((prev) => { const s = new Set(prev); s.delete(stepId); return s; });
    }
  };

  const setStepStatus = async (phaseId: string, stepId: string, status: StepStatus) => {
    const newPhases = phases.map((phase) =>
      phase.id !== phaseId ? phase : {
        ...phase,
        steps: phase.steps.map((step) => {
          if (step.id !== stepId) return step;
          const sessionsCompleted = status === "done" ? step.sessionsRequired : status === "in-progress" ? 1 : 0;
          return { ...step, sessionsCompleted };
        }),
      }
    );
    setPhases(newPhases);
    try {
      await persist(newPhases);
    } catch {
      toast.error("Failed to save.");
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const markerId = `arr-${roadmap.id.slice(0, 8)}`;

  return (
    <>
      <div className="rounded-lg bg-zinc-950 overflow-hidden">
        {/* ─── Hero header ─── */}
        {roadmap.image ? (
          <div className="relative h-48 w-full overflow-hidden md:h-56">
            <img
              src={roadmap.image}
              alt={roadmap.title}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "grayscale(50%) saturate(0.7)" }}
            />
            {/* heavy dark overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />

            {/* content on top of image */}
            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5 md:px-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mb-1.5">
                {roadmap.level && <span className="rounded bg-zinc-800/80 px-2 py-0.5 backdrop-blur-sm">{roadmap.level}</span>}
                <span className="text-zinc-600">·</span>
                <span>{allSteps.length} steps</span>
                <span className="text-zinc-600">·</span>
                <span>{roadmap.phases.length} phases</span>
              </div>
              <h2 className="font-display text-xl font-bold text-zinc-100 md:text-2xl">{roadmap.title}</h2>
              {/* progress bar inside header */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-zinc-800/80">
                  <div className="h-full rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-cyan-400 tabular-nums shrink-0">
                  {doneCount}/{allSteps.length}
                  {inProgressCount > 0 && <span className="ml-1.5 text-amber-400">· {inProgressCount} in progress</span>}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-0 pt-5 md:px-8 md:pt-8">
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="text-xl font-bold text-zinc-100">{roadmap.title}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-cyan-500" />
                  <span className="font-semibold text-cyan-500">{progress}%</span>
                </span>
                <span className="text-zinc-700">·</span>
                <span>{doneCount}/{allSteps.length} steps</span>
                {inProgressCount > 0 && <><span className="text-zinc-700">·</span><span className="text-amber-400">{inProgressCount} in progress</span></>}
                {roadmap.level && <><span className="text-zinc-700">·</span><span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">{roadmap.level}</span></>}
              </div>
            </div>
            <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="p-5 md:p-8">
        <div className="relative z-[1]">

        {/* ─── Admin: batch action bar ─── */}
        {adminMode && (() => {
          const activeBatch = batchGenerating
            ? { label: "Generating descriptions", progress: batchProgress, color: "bg-cyan-500" }
            : batchExercising
            ? { label: "Finding exercises", progress: batchExerciseProgress, color: "bg-violet-500" }
            : batchLessoning
            ? { label: "Finding lessons", progress: batchLessonProgress, color: "bg-red-500" }
            : null;

          const stepsWithDesc = allSteps.filter((s) => s.description).length;
          const stepsWithEx = allSteps.filter((s) => s.suggestedExerciseId || s.noExercise).length;
          const stepsWithLessons = allSteps.filter((s) => s.suggestedLessonIds?.length).length;

          return (
            <div className="mb-5 rounded-lg bg-zinc-900/40 px-4 py-3">
              {activeBatch ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-400">
                    {activeBatch.label} {activeBatch.progress.done}/{activeBatch.progress.total}…
                  </span>
                  <div className="ml-auto h-1 w-32 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${activeBatch.color}`}
                      style={{ width: `${activeBatch.progress.total ? (activeBatch.progress.done / activeBatch.progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
                    <span><span className="text-zinc-400">{stepsWithDesc}</span>/{allSteps.length} described</span>
                    <span><span className="text-zinc-400">{stepsWithEx}</span>/{allSteps.length} exercises</span>
                    <span><span className="text-zinc-400">{stepsWithLessons}</span>/{allSteps.length} lessons</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleGenerateAll} className="flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-cyan-300">
                      <Sparkles className="h-3.5 w-3.5" /> All descriptions
                    </button>
                    <button onClick={handleFindAllExercises} className="flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-violet-300">
                      <Dumbbell className="h-3.5 w-3.5" /> All exercises
                    </button>
                    <button onClick={handleFindAllLessons} className="flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-red-300">
                      <FaYoutube className="h-3.5 w-3.5" /> All lessons
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── Legend ─── */}
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg bg-zinc-900/40 px-4 py-2.5">
          <span className="text-xs font-medium text-zinc-500">Status:</span>
          {([
            { dot: "bg-zinc-600", label: "To do" },
            { dot: "bg-amber-400", label: "In progress" },
            { dot: "bg-cyan-500", label: "Done" },
          ] as { dot: string; label: string }[]).map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
          <span className="ml-auto text-xs text-zinc-600">Click step → details</span>
        </div>

        {/* ─── Graph ─── */}
        <div ref={containerRef} className="relative">
          {svgDims.w > 0 && (
            <svg
              className="pointer-events-none absolute left-0 top-0 hidden overflow-visible sm:block"
              width={svgDims.w} height={svgDims.h} style={{ zIndex: 0 }}
            >
              <defs>
                {(["not-started", "in-progress", "done"] as StepStatus[]).map((s) => (
                  <marker key={s} id={`${markerId}-${s}`} markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 5 2, 0 4" fill={PATH_COLOR[s]} />
                  </marker>
                ))}
              </defs>
              {svgPaths.map((path) => (
                <path
                  key={path.key} d={path.d} stroke={PATH_COLOR[path.status]}
                  strokeWidth="2" fill="none" strokeDasharray="5 3"
                  markerEnd={`url(#${markerId}-${path.status})`} opacity="0.8"
                />
              ))}
            </svg>
          )}

          <div className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
            {/* Root node */}
            <div className="max-w-sm rounded-lg bg-zinc-800/90 px-8 py-4 text-center text-sm font-bold text-zinc-100">
              {roadmap.goal}
            </div>

            <div className="relative w-full">
              <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-zinc-800 sm:block" />
              <div
                className="absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-cyan-600/50 transition-all duration-700 sm:block"
                style={{ height: `${progress}%` }}
              />

              {phases.map((phase, phaseIdx) => {
                const stepsRight = phaseIdx % 2 === 0;
                const phaseColor = PHASE_COLORS[phaseIdx % PHASE_COLORS.length];
                const phaseAllDone = phase.steps.every((s) => getStatus(s) === "done");

                return (
                  <div key={phase.id} className="flex w-full flex-col py-6 sm:items-center sm:py-10">

                    {/* ── MOBILE layout ── */}
                    <div className="flex w-full flex-col gap-3 sm:hidden">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-[11px] font-bold transition-all duration-300 ${phaseAllDone ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : phaseColor.badge}`}>
                          {phaseAllDone ? <Check className="h-4 w-4" /> : phaseIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-zinc-200">{phase.title}</span>
                      </div>
                      <div className="ml-4 flex flex-col gap-3 pl-4">
                        {phase.steps.map((step, stepIdx) => {
                          const status = getStatus(step);
                          const isActive = drawerStepId === step.id;
                          const isLoading = loadingDetailIds.has(step.id);
                          return (
                            <button
                              key={step.id}
                              onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                              className={`flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left ${STEP_CLS[status]} ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}`}
                            >
                              {isLoading
                                ? <span className="h-2 w-2 shrink-0 animate-pulse rounded bg-zinc-500" />
                                : <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                              }
                              <span>{step.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── DESKTOP layout ── */}
                    <div className="hidden w-full sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-x-24 md:gap-x-40">
                      {/* LEFT column */}
                      <div className="flex flex-col items-end gap-5">
                        {!stepsRight && phase.steps.map((step, stepIdx) => {
                          const status = getStatus(step);
                          const isActive = drawerStepId === step.id;
                          const isLoading = loadingDetailIds.has(step.id);
                          return (
                            <button
                              key={step.id}
                              ref={(el) => { if (el) stepBtnRefs.current.set(step.id, el); else stepBtnRefs.current.delete(step.id); }}
                              onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                              className={`flex max-w-[260px] items-center gap-2.5 rounded px-3 py-2.5 text-xs font-medium transition-all duration-150 text-right ${STEP_CLS[status]} ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}`}
                            >
                              {isLoading
                                ? <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-500" />
                                : <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                              }
                              <span>{step.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* CENTER — phase milestone */}
                      <div
                        ref={(el) => { if (el) phaseNodeRefs.current.set(phase.id, el); else phaseNodeRefs.current.delete(phase.id); }}
                        className="relative z-10 flex shrink-0 items-center gap-2.5 whitespace-nowrap bg-zinc-950 py-1 pl-1 pr-3"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-[11px] font-bold transition-all duration-300 ${phaseAllDone ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : phaseColor.badge}`}>
                          {phaseAllDone ? <Check className="h-4 w-4" /> : phaseIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-zinc-200">{phase.title}</span>
                      </div>

                      {/* RIGHT column */}
                      <div className="flex flex-col items-start gap-5">
                        {stepsRight && phase.steps.map((step, stepIdx) => {
                          const status = getStatus(step);
                          const isActive = drawerStepId === step.id;
                          const isLoading = loadingDetailIds.has(step.id);
                          return (
                            <button
                              key={step.id}
                              ref={(el) => { if (el) stepBtnRefs.current.set(step.id, el); else stepBtnRefs.current.delete(step.id); }}
                              onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                              className={`flex max-w-[260px] items-center gap-2.5 rounded px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left ${STEP_CLS[status]} ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}`}
                            >
                              {isLoading
                                ? <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-500" />
                                : <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                              }
                              <span>{step.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Finish node */}
            {phases.length > 0 && (
              <div className={`rounded-lg px-8 py-4 text-center text-sm font-semibold transition-all duration-700 ${
                progress === 100
                  ? "bg-cyan-950/20 text-cyan-400"
                  : "bg-zinc-900/30 text-zinc-500 opacity-40"
              }`}>
                {progress === 100 ? "🏆 Goal achieved!" : "🏆 Finish"}
              </div>
            )}
          </div>
        </div>{/* end relative z-[1] */}
        </div>{/* end p-5 md:p-8 */}
        </div>{/* end rounded-lg bg-zinc-950 */}
      </div>{/* end outer wrapper */}

      {mounted && createPortal(
        <>
          {/* ─── Drawer overlay ─── */}
          <div
            className={`fixed inset-0 z-[800] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${drawerInfo ? "opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={() => setDrawerStepId(null)}
          />

          {/* ─── Drawer panel ─── */}
          <div className={`fixed right-0 top-0 z-[900] flex h-full w-full max-w-xl flex-col bg-zinc-950 transition-transform duration-300 ${drawerInfo ? "translate-x-0" : "translate-x-full"}`}>
            {drawerInfo && (
              <>
                {/* ── Sticky header ── */}
                <div className="shrink-0 bg-zinc-950/95 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold capitalize tracking-widest text-zinc-500">
                          Phase {drawerInfo.phaseIdx + 1}
                        </span>
                        <span className="text-[10px] text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">step {drawerInfo.stepIdx + 1}</span>
                      </div>
                      <h2 className="text-base font-bold leading-snug text-zinc-100">{drawerInfo.step.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {adminMode && drawerInfo.step.description && !loadingDetailIds.has(drawerInfo.step.id) && (
                        <button
                          onClick={() => handleRegenerateStep(drawerInfo.step, drawerInfo.phase, drawerInfo.stepIdx, drawerInfo.phaseIdx)}
                          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
                        >
                          <RefreshCw className="h-3 w-3" /> Regen
                        </button>
                      )}
                      <button
                        onClick={() => setDrawerStepId(null)}
                        aria-label="Close"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-400 transition-background hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_BTNS.map(({ status: s, label }) => {
                        const isActive = getStatus(drawerInfo.step) === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStepStatus(drawerInfo.phase.id, drawerInfo.step.id, s)}
                            className={`rounded py-2 text-xs font-semibold transition-all ${
                              isActive
                                ? s === "not-started" ? "bg-zinc-700 text-zinc-100"
                                  : s === "in-progress" ? "bg-amber-500/15 text-amber-300"
                                  : "bg-cyan-900/40 text-cyan-400"
                                : "bg-zinc-900/60 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Mobile close bar ── */}
                <div className="flex shrink-0 items-center justify-center py-2 sm:hidden">
                  <button
                    onClick={() => setDrawerStepId(null)}
                    className="flex items-center gap-2 rounded px-4 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <X className="h-3.5 w-3.5" /> Close
                  </button>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto">
                  {loadingDetailIds.has(drawerInfo.step.id) ? (
                    <div className="p-6">
                      <AiGeneratingLoader stepTitle={drawerInfo.step.title} />
                    </div>
                  ) : drawerInfo.step.description ? (
                    <div className="flex flex-col gap-0">

                      {/* ── Exercise ── */}
                      {adminMode ? (
                        <div className="px-6 py-5">
                          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold capitalize tracking-widest text-zinc-500">
                            <Dumbbell className="h-3 w-3 text-cyan-500" /> Exercise
                          </p>
                          {loadingExerciseIds.has(drawerInfo.step.id) ? (
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching exercises…
                            </div>
                          ) : exerciseOptions[drawerInfo.step.id] ? (
                            <div className="space-y-2">
                              <p className="text-[11px] text-zinc-600">Pick one:</p>
                              {exerciseOptions[drawerInfo.step.id].map((id) => {
                                const ex = exercisesAgregat.find((e) => e.id === id);
                                if (!ex) return null;
                                return (
                                  <button
                                    key={id}
                                    onClick={() => handleSelectExercise(drawerInfo.step.id, drawerInfo.phase.id, id)}
                                    className="flex w-full items-center gap-3 rounded bg-zinc-900 px-3 py-2.5 text-left text-xs transition hover:bg-zinc-800"
                                  >
                                    <Dumbbell className="h-4 w-4 shrink-0 text-cyan-500" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-semibold text-zinc-100">{ex.title}</p>
                                      {ex.difficulty && <p className="capitalize text-zinc-500">{ex.difficulty} · {ex.category}</p>}
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                  </button>
                                );
                              })}
                              <button onClick={() => handleFindExercises(drawerInfo.step)} className="text-[11px] text-zinc-600 underline underline-offset-2 hover:text-zinc-300">
                                Search again
                              </button>
                            </div>
                          ) : drawerInfo.step.noExercise ? (
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-500">
                                <X className="h-3 w-3" /> No exercise
                              </span>
                              <button onClick={() => handleEditStep(drawerInfo.step.id, drawerInfo.phase.id, { noExercise: false })} className="text-[11px] text-zinc-600 underline underline-offset-2 hover:text-zinc-300">
                                Undo
                              </button>
                            </div>
                          ) : drawerInfo.step.suggestedExerciseId ? (
                            (() => {
                              const ex = exercisesAgregat.find((e) => e.id === drawerInfo.step.suggestedExerciseId);
                              if (!ex) return null;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 rounded-lg bg-cyan-950/25 px-3 py-2.5">
                                    <Dumbbell className="h-4 w-4 shrink-0 text-cyan-400" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-bold text-zinc-100">{ex.title}</p>
                                      {ex.difficulty && <p className="text-[11px] capitalize text-zinc-500">{ex.difficulty} · {ex.category}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => handleFindExercises(drawerInfo.step)} className="flex items-center gap-1 text-[11px] text-zinc-600 underline underline-offset-2 hover:text-zinc-300">
                                      <RefreshCw className="h-2.5 w-2.5" /> Change exercise
                                    </button>
                                    <button onClick={() => handleEditStep(drawerInfo.step.id, drawerInfo.phase.id, { suggestedExerciseId: undefined, noExercise: true })} className="text-[11px] text-zinc-700 underline underline-offset-2 hover:text-red-400">
                                      No exercise
                                    </button>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleFindExercises(drawerInfo.step)} className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-cyan-300">
                                <Sparkles className="h-3.5 w-3.5" /> Find exercise
                              </button>
                              <button onClick={() => handleEditStep(drawerInfo.step.id, drawerInfo.phase.id, { noExercise: true })} className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-300">
                                <X className="h-3.5 w-3.5" /> No exercise
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        (loadingExerciseIds.has(drawerInfo.step.id) || drawerInfo.step.suggestedExerciseId) && (
                          <div className="px-6 py-5">
                            {loadingExerciseIds.has(drawerInfo.step.id) ? (
                              <div className="flex items-center gap-3 rounded-lg bg-zinc-900/40 px-4 py-3">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-500" />
                                <p className="text-xs text-zinc-500">Finding best exercise for this step...</p>
                              </div>
                            ) : (() => {
                              const ex = exercisesAgregat.find((e) => e.id === drawerInfo.step.suggestedExerciseId);
                              if (!ex) return null;
                              return (
                                <>
                                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold capitalize tracking-widest text-zinc-500">
                                    <Dumbbell className="h-3 w-3 text-cyan-500" /> Recommended exercise
                                  </p>
                                  <button
                                    onClick={() => router.push(`/profile/skills?exerciseId=${ex.id}`)}
                                    className="group relative flex w-full items-center gap-4 overflow-hidden rounded-lg bg-cyan-950/30 px-4 py-4 text-left transition-all hover:bg-cyan-950/50"
                                  >
                                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent" />
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 transition group-hover:bg-cyan-500/25">
                                      <Dumbbell className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-bold text-zinc-100">{ex.title}</p>
                                      {ex.difficulty && <p className="mt-0.5 text-[11px] capitalize text-zinc-500">{ex.difficulty} · {ex.category}</p>}
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-cyan-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )
                      )}

                      {/* ── Description ── */}
                      <div className="border-b border-zinc-800/40 px-6 py-5">
                        {adminMode ? (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-widest text-zinc-500">Description</label>
                            <textarea
                              rows={8}
                              className="w-full resize-y rounded-lg bg-zinc-800/60 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none transition focus:ring-1 focus:ring-cyan-500"
                              value={drawerInfo.step.description}
                              onChange={(e) => handleEditStep(drawerInfo.step.id, drawerInfo.phase.id, { description: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
                            {drawerInfo.step.description.split("\n").map((line, i) => {
                              const sectionMatch = line.match(/^\[(.+)\]$/);
                              if (sectionMatch) return <p key={i} className="mt-4 text-[10px] font-semibold capitalize tracking-widest text-zinc-600 first:mt-0">{sectionMatch[1]}</p>;
                              if (line.startsWith("- ")) return (
                                <div key={i} className="flex items-start gap-2.5">
                                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
                                  <span className="text-zinc-300">{line.slice(2)}</span>
                                </div>
                              );
                              if (line.trim() === "") return null;
                              return <p key={i} className="text-zinc-300">{line}</p>;
                            })}
                          </div>
                        )}
                      </div>

                      {/* ── Success criteria ── */}
                      {(drawerInfo.step.successCriteria || adminMode) && (
                        <div className="px-6 py-5">
                          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold capitalize tracking-widest text-zinc-500">
                            <Target className="h-3.5 w-3.5 text-cyan-500" /> Success criteria
                          </p>
                          {adminMode ? (
                            <textarea
                              rows={3}
                              className="w-full resize-y rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:ring-1 focus:ring-cyan-500"
                              value={drawerInfo.step.successCriteria}
                              onChange={(e) => handleEditStep(drawerInfo.step.id, drawerInfo.phase.id, { successCriteria: e.target.value })}
                            />
                          ) : (
                            <div className="rounded-lg bg-cyan-950/25 px-4 py-3.5">
                              <p className="text-sm leading-relaxed text-zinc-200">{drawerInfo.step.successCriteria}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── YouTube lessons ── */}
                      {adminMode ? (
                        <div className="px-6 py-5">
                          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold capitalize tracking-widest text-zinc-500">
                            <FaYoutube className="h-3.5 w-3.5 text-red-500" /> YouTube Lessons
                          </p>
                          {loadingLessonsId === drawerInfo.step.id ? (
                            <div className="space-y-2">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="flex h-[61px] animate-pulse items-center gap-3 rounded bg-zinc-900/60 px-3">
                                  <div className="h-[45px] w-[80px] shrink-0 rounded bg-zinc-800" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 rounded bg-zinc-800" />
                                    <div className="h-2.5 w-1/2 rounded bg-zinc-800" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : lessonsCache[drawerInfo.step.id]?.length ? (
                            <div className="space-y-2">
                              {lessonsCache[drawerInfo.step.id].map((lesson) => (
                                <div key={lesson.videoId} className="group relative">
                                  <YouTubeLessonCard lesson={lesson} />
                                  <button
                                    onClick={() => handleRemoveLesson(drawerInfo.step.id, drawerInfo.phase.id, lesson.videoId)}
                                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded bg-zinc-800/80 text-zinc-500 opacity-0 transition hover:bg-red-900/60 hover:text-red-400 group-hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button onClick={() => handleFindLessons(drawerInfo.step, drawerInfo.phase)} className="flex items-center gap-1 text-[11px] text-zinc-600 underline underline-offset-2 hover:text-zinc-300">
                                <RefreshCw className="h-2.5 w-2.5" /> Search again
                              </button>
                              <div className="flex gap-2 pt-1">
                                <input
                                  type="text" placeholder="Paste YouTube URL…"
                                  value={customLessonInput[drawerInfo.step.id] ?? ""}
                                  onChange={(e) => setCustomLessonInput((prev) => ({ ...prev, [drawerInfo.step.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomLesson(drawerInfo.step.id, drawerInfo.phase.id, customLessonInput[drawerInfo.step.id] ?? ""); }}
                                  className="flex-1 rounded-lg bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-red-600"
                                />
                                <button
                                  onClick={() => handleAddCustomLesson(drawerInfo.step.id, drawerInfo.phase.id, customLessonInput[drawerInfo.step.id] ?? "")}
                                  disabled={addingCustomLesson.has(drawerInfo.step.id)}
                                  className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-red-300 disabled:opacity-50"
                                >
                                  {addingCustomLesson.has(drawerInfo.step.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <FaYoutube className="h-3 w-3 text-red-500" />}
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button onClick={() => handleFindLessons(drawerInfo.step, drawerInfo.phase)} className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-red-300">
                                <FaYoutube className="h-3.5 w-3.5 text-red-500" /> Find lessons
                              </button>
                              <div className="flex gap-2">
                                <input
                                  type="text" placeholder="Or paste YouTube URL…"
                                  value={customLessonInput[drawerInfo.step.id] ?? ""}
                                  onChange={(e) => setCustomLessonInput((prev) => ({ ...prev, [drawerInfo.step.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomLesson(drawerInfo.step.id, drawerInfo.phase.id, customLessonInput[drawerInfo.step.id] ?? ""); }}
                                  className="flex-1 rounded-lg bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-red-600"
                                />
                                <button
                                  onClick={() => handleAddCustomLesson(drawerInfo.step.id, drawerInfo.phase.id, customLessonInput[drawerInfo.step.id] ?? "")}
                                  disabled={addingCustomLesson.has(drawerInfo.step.id)}
                                  className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-red-300 disabled:opacity-50"
                                >
                                  {addingCustomLesson.has(drawerInfo.step.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <FaYoutube className="h-3 w-3 text-red-500" />}
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        (loadingLessonsId === drawerInfo.step.id || (lessonsCache[drawerInfo.step.id] && lessonsCache[drawerInfo.step.id].length > 0)) && (
                          <div className="px-6 py-5">
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold capitalize tracking-widest text-zinc-500">
                              <FaYoutube className="h-3.5 w-3.5 text-red-500" /> YouTube Lessons
                            </p>
                            {loadingLessonsId === drawerInfo.step.id ? (
                              <div className="space-y-2">
                                {[0, 1, 2].map((i) => (
                                  <div key={i} className="flex h-[61px] animate-pulse items-center gap-3 rounded bg-zinc-900/60 px-3">
                                    <div className="h-[45px] w-[80px] shrink-0 rounded bg-zinc-800" />
                                    <div className="flex-1 space-y-2">
                                      <div className="h-3 w-3/4 rounded bg-zinc-800" />
                                      <div className="h-2.5 w-1/2 rounded bg-zinc-800" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {lessonsCache[drawerInfo.step.id].map((lesson) => (
                                  <YouTubeLessonCard key={lesson.videoId} lesson={lesson} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <p className="text-sm text-zinc-500">Detailed description will be generated.</p>
                      <p className="text-xs text-zinc-700">Close and reopen this step to load the description.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default RoadmapView;
