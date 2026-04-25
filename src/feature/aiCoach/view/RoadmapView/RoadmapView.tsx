import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { Check, ChevronRight, Dumbbell, Map as MapIcon, Target, X, Zap } from "lucide-react";
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
      {/* Icon + message */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative flex items-center justify-center">
          {/* Outer glow rings */}
          <span className="absolute h-16 w-16 animate-ping rounded-full bg-cyan-500/10" />
          <span className="absolute h-12 w-12 animate-pulse rounded-full bg-cyan-500/15" />
          {/* Icon */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/40">
            <MapIcon className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-500/70">
            Roadmap is thinking
          </p>
          <p
            className="text-sm text-zinc-400 transition-opacity duration-300"
            style={{ opacity: fade ? 1 : 0 }}
          >
            {AI_MESSAGES[msgIdx]}
          </p>
        </div>

        {/* Typing dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-cyan-500/60"
              style={{
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Context hint */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Generating details for
        </p>
        <p className="text-sm font-medium text-zinc-300">{stepTitle}</p>
      </div>

      {/* Shimmer skeleton */}
      <div className="flex flex-col gap-4">
        {[92, 100, 78, 95, 65, 88].map((w, i) => (
          <div
            key={i}
            className="h-3 overflow-hidden rounded-full bg-zinc-800/60"
            style={{ width: `${w}%` }}
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.12) 50%, transparent 100%)",
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
  "not-started":
    "border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80",
  "in-progress":
    "border-amber-500/50 bg-amber-500/10 text-amber-200 hover:border-amber-400/70",
  done: "border-cyan-800/50 bg-cyan-950/30 text-zinc-500",
};

const STATUS_DOT: Record<StepStatus, string> = {
  "not-started": "bg-zinc-600",
  "in-progress": "bg-amber-400 shadow-sm shadow-amber-500/40",
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
  { badge: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30", border: "border-violet-500/30" },
  { badge: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30", border: "border-sky-500/30" },
  { badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30", border: "border-amber-500/30" },
  { badge: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30", border: "border-rose-500/30" },
  { badge: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30", border: "border-cyan-500/30" },
  { badge: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30", border: "border-orange-500/30" },
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
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onUpdate }) => {
  const router = useRouter();
  const [phases, setPhases] = useState<RoadmapPhase[]>(roadmap.phases ?? []);
  const [drawerStepId, setDrawerStepId] = useState<string | null>(null);
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<string>>(new Set());
  const [loadingExerciseIds, setLoadingExerciseIds] = useState<Set<string>>(new Set());
  const [lessonsCache, setLessonsCache] = useState<Record<string, YouTubeLessonResult[]>>({});
  const [loadingLessonsId, setLoadingLessonsId] = useState<string | null>(null);

  // SVG overlay refs
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const stepBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [svgPaths, setSvgPaths] = useState<SvgPath[]>([]);
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0 });

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerStepId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerStepId]);

  // Drawer info derived from phases — always fresh
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

  // ─── SVG path calculation ───
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

      // Alternate: even phases → steps on RIGHT, odd → steps on LEFT
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
          const cp1X = x0 + span * 0.75;
          const cp2X = x0 + span * 0.25;
          d = `M ${x0} ${pCY} C ${cp1X} ${pCY} ${cp2X} ${sCY} ${x3} ${sCY}`;
        } else {
          const x0 = pLX;
          const x3 = sRect.right - cRect.left;
          const span = x0 - x3;
          const cp1X = x0 - span * 0.75;
          const cp2X = x0 - span * 0.25;
          d = `M ${x0} ${pCY} C ${cp1X} ${pCY} ${cp2X} ${sCY} ${x3} ${sCY}`;
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

  // ─── Metrics ───
  const allSteps = useMemo(() => phases.flatMap((p) => p.steps), [phases]);
  const doneCount = useMemo(
    () => allSteps.filter((s) => getStatus(s) === "done").length,
    [allSteps]
  );
  const inProgressCount = useMemo(
    () => allSteps.filter((s) => getStatus(s) === "in-progress").length,
    [allSteps]
  );
  const progress =
    allSteps.length > 0 ? Math.round((doneCount / allSteps.length) * 100) : 0;

  // ─── Lazy detail fetch ───
  const openDrawer = async (
    step: RoadmapStep,
    phase: RoadmapPhase,
    stepIdx: number,
    phaseIdx: number
  ) => {
    setDrawerStepId(step.id);

    // Generate description first if missing, so YouTube search has it available
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
            allPhases: phases.map((p) => ({
              title: p.title,
              steps: p.steps.map((s) => s.title),
            })),
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
            p.id !== phase.id
              ? p
              : { ...p, steps: p.steps.map((s) => (s.id !== step.id ? s : finalEnriched)) }
          );
          return savedPhases;
        });
        onUpdate?.({ ...roadmap, phases: savedPhases, updatedAt: new Date().toISOString() });
        await firebaseUpdateRoadmap(roadmap.id, { phases: savedPhases });
      } catch (err) {
        console.warn("Failed to fetch step detail:", err);
      } finally {
        setLoadingDetailIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
      }
    }

    // Fetch YouTube lessons after description is available (cached per step)
    if (!lessonsCache[step.id] && !loadingLessonsId) {
      setLoadingLessonsId(step.id);

      const fetchLessons = async () => {
        // If already saved in Firebase – load from Firestore, skip Upstash
        if (enrichedStep.suggestedLessonIds?.length) {
          const firestoreLessons = await firebaseGetLessonsByIds(enrichedStep.suggestedLessonIds);
          return firestoreLessons.map((l) => ({
            videoId: l.videoId,
            title: l.title,
            channelName: l.channelName,
            thumbnailUrl: l.thumbnailUrl,
            duration: l.duration,
            level: l.level,
            topics: l.topics,
            score: l.qualityScore ?? 0,
          })) as YouTubeLessonResult[];
        }

        // First time – search Upstash with full description, then save IDs to Firebase
        const res = await fetch("/api/search-youtube-lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepTitle: enrichedStep.title,
            stepDescription: enrichedStep.description || "",
            roadmapGoal: roadmap.goal,
            roadmapLevel: roadmap.level,
          }),
        });
        const data = await res.json();
        const lessons: YouTubeLessonResult[] = data.lessons ?? [];

        if (lessons.length > 0) {
          const lessonIds = lessons.map((l) => l.videoId);
          setPhases((prev) => {
            const newPhases = prev.map((p) =>
              p.id !== phase.id
                ? p
                : {
                    ...p,
                    steps: p.steps.map((s) =>
                      s.id !== step.id ? s : { ...s, suggestedLessonIds: lessonIds }
                    ),
                  }
            );
            firebaseUpdateRoadmap(roadmap.id, { phases: newPhases });
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

    if (enrichedStep.suggestedExerciseId || step.suggestedExerciseId) return;
    setLoadingExerciseIds((prev) => new Set(prev).add(step.id));
    try {
      const exRes = await fetch("/api/search-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepTitle: step.title,
          description: enrichedStep.description || step.description || "",
          goal: roadmap.goal,
          level: roadmap.level,
        }),
      });
      const exData = await exRes.json();
      const firstExId = exData.exercise_ids?.[0] ?? null;
      if (!firstExId) return;

      setPhases((prev) => {
        const phasesWithEx = prev.map((p) =>
          p.id !== phase.id
            ? p
            : {
                ...p,
                steps: p.steps.map((s) =>
                  s.id !== step.id ? s : { ...s, suggestedExerciseId: firstExId }
                ),
              }
        );
        firebaseUpdateRoadmap(roadmap.id, { phases: phasesWithEx });
        onUpdate?.({ ...roadmap, phases: phasesWithEx, updatedAt: new Date().toISOString() });
        return phasesWithEx;
      });
    } catch (err) {
      console.warn("Failed to search exercise:", err);
    } finally {
      setLoadingExerciseIds((prev) => { const s = new Set(prev); s.delete(step.id); return s; });
    }

  };

  const setStepStatus = async (phaseId: string, stepId: string, status: StepStatus) => {
    const newPhases = phases.map((phase) =>
      phase.id !== phaseId
        ? phase
        : {
            ...phase,
            steps: phase.steps.map((step) => {
              if (step.id !== stepId) return step;
              const sessionsCompleted =
                status === "done"
                  ? step.sessionsRequired
                  : status === "in-progress"
                    ? 1
                    : 0;
              return { ...step, sessionsCompleted };
            }),
          }
    );
    setPhases(newPhases);
    try {
      await firebaseUpdateRoadmap(roadmap.id, { phases: newPhases });
    } catch {
      toast.error("Failed to save.");
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const markerId = `arr-${roadmap.id.slice(0, 8)}`;

  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-8">
        {/* ─── Header ─── */}
        <div className="mb-5 flex flex-col gap-1">
          <h2 className="text-xl font-bold text-zinc-100">{roadmap.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-cyan-500" />
              <span className="font-semibold text-cyan-500">{progress}%</span>
            </span>
            <span className="text-zinc-700">·</span>
            <span>{doneCount}/{allSteps.length} steps</span>
            {inProgressCount > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-amber-400">{inProgressCount} in progress</span>
              </>
            )}
            {roadmap.level && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">
                  {roadmap.level}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ─── Progress bar ─── */}
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ─── Legend ─── */}
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-2.5">
          <span className="text-xs font-medium text-zinc-500">Status:</span>
          {(
            [
              { dot: "bg-zinc-600", label: "To do" },
              { dot: "bg-amber-400", label: "In progress" },
              { dot: "bg-cyan-500", label: "Done" },
            ] as { dot: string; label: string }[]
          ).map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
          <span className="ml-auto text-xs text-zinc-600">Click step → details</span>
        </div>

        {/* ─── Graph ─── */}
        <div ref={containerRef} className="relative">
          {/* SVG overlay with bezier arrows */}
          {svgDims.w > 0 && (
            <svg
              className="pointer-events-none absolute left-0 top-0 hidden overflow-visible sm:block"
              width={svgDims.w}
              height={svgDims.h}
              style={{ zIndex: 0 }}
            >
              <defs>
                {(["not-started", "in-progress", "done"] as StepStatus[]).map((s) => (
                  <marker
                    key={s}
                    id={`${markerId}-${s}`}
                    markerWidth="5"
                    markerHeight="4"
                    refX="5"
                    refY="2"
                    orient="auto"
                  >
                    <polygon points="0 0, 5 2, 0 4" fill={PATH_COLOR[s]} />
                  </marker>
                ))}
              </defs>
              {svgPaths.map((path) => (
                <path
                  key={path.key}
                  d={path.d}
                  stroke={PATH_COLOR[path.status]}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5 3"
                  markerEnd={`url(#${markerId}-${path.status})`}
                  opacity="0.8"
                />
              ))}
            </svg>
          )}

          {/* Nodes */}
          <div className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
            {/* Root node */}
            <div className="max-w-sm rounded-2xl border border-zinc-600/80 bg-zinc-800/90 px-8 py-4 text-center text-sm font-bold text-zinc-100 shadow-lg shadow-black/30 ring-1 ring-zinc-600/20">
              {roadmap.goal}
            </div>

            {/* Phases wrapper — continuous spine lives here */}
            <div className="relative w-full">
              {/* Background track — desktop only */}
              <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-zinc-800 sm:block" />
              {/* Progress fill — desktop only */}
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

                    {/* ── MOBILE layout (< sm) ── */}
                    <div className="flex w-full flex-col gap-3 sm:hidden">
                      {/* Phase header */}
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${phaseAllDone ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : phaseColor.badge}`}>
                          {phaseAllDone ? <Check className="h-4 w-4" /> : phaseIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-zinc-200">{phase.title}</span>
                      </div>
                      {/* Steps — indented */}
                      <div className="ml-4 flex flex-col gap-3 border-l-2 border-zinc-800 pl-4">
                        {phase.steps.map((step, stepIdx) => {
                          const status = getStatus(step);
                          const isActive = drawerStepId === step.id;
                          const isLoading = loadingDetailIds.has(step.id);
                          return (
                            <button
                              key={step.id}
                              onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                              className={`
                                flex w-full items-center gap-2.5 rounded-xl border
                                px-3 py-2.5 text-xs font-medium transition-all
                                duration-150 text-left
                                ${STEP_CLS[status]}
                                ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}
                              `}
                            >
                              {isLoading ? (
                                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-500" />
                              ) : (
                                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                              )}
                              <span>{step.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── DESKTOP layout (sm+) ── */}
                    <div className="hidden w-full sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-x-24 md:gap-x-40">
                      {/* LEFT column */}
                      <div className="flex flex-col items-end gap-5">
                        {!stepsRight &&
                          phase.steps.map((step, stepIdx) => {
                            const status = getStatus(step);
                            const isActive = drawerStepId === step.id;
                            const isLoading = loadingDetailIds.has(step.id);
                            return (
                              <button
                                key={step.id}
                                ref={(el) => {
                                  if (el) stepBtnRefs.current.set(step.id, el);
                                  else stepBtnRefs.current.delete(step.id);
                                }}
                                onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                                className={`
                                  flex max-w-[260px] items-center gap-2.5 rounded-xl border
                                  px-3 py-2.5 text-xs font-medium transition-all
                                  duration-150 text-right
                                  ${STEP_CLS[status]}
                                  ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}
                                `}
                              >
                                {isLoading ? (
                                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-500" />
                                ) : (
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                                )}
                                <span>{step.title}</span>
                              </button>
                            );
                          })}
                      </div>

                      {/* CENTER — phase milestone */}
                      <div
                        ref={(el) => {
                          if (el) phaseNodeRefs.current.set(phase.id, el);
                          else phaseNodeRefs.current.delete(phase.id);
                        }}
                        className="relative z-10 flex shrink-0 items-center gap-2.5 whitespace-nowrap bg-zinc-950 py-1 pl-1 pr-3"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${phaseAllDone ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : phaseColor.badge}`}>
                          {phaseAllDone ? <Check className="h-4 w-4" /> : phaseIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-zinc-200">
                          {phase.title}
                        </span>
                      </div>

                      {/* RIGHT column */}
                      <div className="flex flex-col items-start gap-5">
                        {stepsRight &&
                          phase.steps.map((step, stepIdx) => {
                            const status = getStatus(step);
                            const isActive = drawerStepId === step.id;
                            const isLoading = loadingDetailIds.has(step.id);
                            return (
                              <button
                                key={step.id}
                                ref={(el) => {
                                  if (el) stepBtnRefs.current.set(step.id, el);
                                  else stepBtnRefs.current.delete(step.id);
                                }}
                                onClick={() => openDrawer(step, phase, stepIdx, phaseIdx)}
                                className={`
                                  flex max-w-[260px] items-center gap-2.5 rounded-xl border
                                  px-3 py-2.5 text-xs font-medium transition-all
                                  duration-150 text-left
                                  ${STEP_CLS[status]}
                                  ${isActive ? "ring-1 ring-cyan-500/50 ring-offset-1 ring-offset-zinc-950" : ""}
                                `}
                              >
                                {isLoading ? (
                                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-500" />
                                ) : (
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                                )}
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
              <div
                className={`rounded-2xl border px-8 py-4 text-center text-sm font-semibold transition-all duration-700 ${
                  progress === 100
                    ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-400 shadow-lg shadow-cyan-950/30"
                    : "border-zinc-800 bg-zinc-900/30 text-zinc-600 opacity-40"
                }`}
              >
                {progress === 100 ? "🏆 Goal achieved!" : "🏆 Finish"}
              </div>
            )}
          </div>
        </div>
      </div>

      {mounted && createPortal(
        <>
          {/* ─── Drawer overlay ─── */}
          <div
            className={`fixed inset-0 z-[800] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
              drawerInfo ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setDrawerStepId(null)}
          />

          {/* ─── Drawer panel ─── */}
          <div
            className={`fixed right-0 top-0 z-[900] flex h-full w-full max-w-xl flex-col bg-zinc-950 shadow-2xl shadow-black/60 transition-transform duration-300 ${
              drawerInfo ? "translate-x-0" : "translate-x-full"
            }`}
          >
        {drawerInfo && (
          <>
            {/* ── Sticky header ── */}
            <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md">
              {/* Phase / step breadcrumb + close */}
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      Phase {drawerInfo.phaseIdx + 1}
                    </span>
                    <span className="text-[10px] text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-600">
                      step {drawerInfo.stepIdx + 1}
                    </span>
                  </div>
                  <h2 className="text-base font-bold leading-snug text-zinc-100">
                    {drawerInfo.step.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerStepId(null)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status buttons */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_BTNS.map(({ status: s, label }) => {
                    const isActive = getStatus(drawerInfo.step) === s;
                    return (
                      <button
                        key={s}
                        onClick={() =>
                          setStepStatus(drawerInfo.phase.id, drawerInfo.step.id, s)
                        }
                        className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? s === "not-started"
                              ? "border-zinc-500 bg-zinc-700 text-zinc-100"
                              : s === "in-progress"
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                                : "border-cyan-600/50 bg-cyan-900/40 text-cyan-400"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-600 hover:border-zinc-600 hover:text-zinc-300"
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
            <div className="flex shrink-0 items-center justify-center border-b border-zinc-800/60 py-2 sm:hidden">
              <button
                onClick={() => setDrawerStepId(null)}
                className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 active:bg-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
                Close
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

                  {/* ── Recommended exercise (prominent CTA) ── */}
                  {(loadingExerciseIds.has(drawerInfo.step.id) || drawerInfo.step.suggestedExerciseId) && (
                    <div className="border-b border-zinc-800/60 px-6 py-5">
                      {loadingExerciseIds.has(drawerInfo.step.id) ? (
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-500" />
                          <p className="text-xs text-zinc-500">Finding best exercise for this step...</p>
                        </div>
                      ) : (() => {
                        const ex = exercisesAgregat.find(e => e.id === drawerInfo.step.suggestedExerciseId);
                        if (!ex) return null;
                        return (
                          <>
                            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                              <Dumbbell className="h-3 w-3 text-cyan-500" />
                              Recommended exercise
                            </p>
                            <button
                              onClick={() => router.push(`/profile/skills?exerciseId=${ex.id}`)}
                              className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-cyan-800/40 bg-cyan-950/30 px-4 py-4 text-left transition-all hover:border-cyan-600/50 hover:bg-cyan-950/50"
                            >
                              {/* glow */}
                              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent" />
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-500/30 transition group-hover:bg-cyan-500/25 group-hover:ring-cyan-500/50">
                                <Dumbbell className="h-5 w-5 text-cyan-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-zinc-100">{ex.title}</p>
                                {ex.difficulty && (
                                  <p className="mt-0.5 text-[11px] capitalize text-zinc-500">{ex.difficulty} · {ex.category}</p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-cyan-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* ── Description ── */}
                  <div className="border-b border-zinc-800/60 px-6 py-5">
                    <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
                      {drawerInfo.step.description.split("\n").map((line, i) => {
                        const sectionMatch = line.match(/^\[(.+)\]$/);
                        if (sectionMatch) {
                          return (
                            <p key={i} className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 first:mt-0">
                              {sectionMatch[1]}
                            </p>
                          );
                        }
                        if (line.startsWith("- ")) {
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
                              <span className="text-zinc-300">{line.slice(2)}</span>
                            </div>
                          );
                        }
                        if (line.trim() === "") return null;
                        return <p key={i} className="text-zinc-300">{line}</p>;
                      })}
                    </div>
                  </div>

                  {/* ── Success criteria ── */}
                  {drawerInfo.step.successCriteria && (
                    <div className="border-b border-zinc-800/60 px-6 py-5">
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        <Target className="h-3.5 w-3.5 text-cyan-500" />
                        Success criteria
                      </p>
                      <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/25 px-4 py-3.5">
                        <p className="text-sm leading-relaxed text-zinc-200">
                          {drawerInfo.step.successCriteria}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── YouTube lessons ── */}
                  {(loadingLessonsId === drawerInfo.step.id ||
                    (lessonsCache[drawerInfo.step.id] && lessonsCache[drawerInfo.step.id].length > 0)) && (
                    <div className="px-6 py-5">
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        <FaYoutube className="h-3.5 w-3.5 text-red-500" />
                        YouTube Lessons
                      </p>
                      {loadingLessonsId === drawerInfo.step.id ? (
                        <div className="space-y-2">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="flex h-[61px] animate-pulse items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3"
                            >
                              <div className="h-[45px] w-[80px] shrink-0 rounded-lg bg-zinc-800" />
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
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-zinc-500">
                    Detailed description will be generated.
                  </p>
                  <p className="text-xs text-zinc-700">
                    Close and reopen this step to load the description.
                  </p>
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
