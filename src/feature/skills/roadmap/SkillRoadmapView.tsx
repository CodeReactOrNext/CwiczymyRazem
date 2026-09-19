import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { motion } from "framer-motion";
import { ChevronRight, Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildSkillRoadmap,
  SKILL_ROADMAP_BACKDROP_SRC,
} from "./skillRoadmap.data";
import { DIFFICULTY_HEX, toDashboardExercise } from "./skillRoadmapChallenge";
import { layoutSkillRoadmap } from "./skillRoadmapLayout";
import {
  computeRoadmapProgress,
  type RoadmapNodeState,
} from "./skillRoadmapStates";
import { type RoadmapNodeHover, SkillRoadmapTree } from "./SkillRoadmapTree";

interface SkillRoadmapViewProps {
  progressMap: Map<string, BpmProgressData>;
  /** Level per skill id — shown beside each branch, since a branch is a skill. */
  skillLevels: Record<string, number>;
  isPremium: boolean;
  onStartExercise: (challenge: DashboardExercise) => void;
  onShowUpgrade: () => void;
  /** Opens the skill sheet (the per-skill exercise list) for a branch label. */
  onSkillClick: (skillId: string) => void;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;
const ZOOM_STEP = 1.2;
const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

/** Arrow-key pan, in screen pixels (hold Shift for the long stride). */
const PAN_STEP = 90;

const STATE_LABEL: Record<RoadmapNodeState, string> = {
  completed: "Completed",
  current: "Up next",
  available: "Not started",
  locked: "Pro exercise",
};

const LEGEND: { state: RoadmapNodeState; className: string }[] = [
  { state: "completed", className: "bg-emerald-400" },
  { state: "current", className: "bg-zinc-950 ring-2 ring-cyan-400" },
  { state: "available", className: "bg-zinc-900 ring-1 ring-zinc-600" },
  { state: "locked", className: "bg-zinc-900 ring-1 ring-zinc-700" },
];

const ProgressRing = ({
  percent,
  size,
  stroke,
  showLabel,
}: {
  percent: number;
  size: number;
  stroke: number;
  showLabel?: boolean;
}) => {
  const r = size / 2 - stroke;
  const circumference = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden='true'>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='#27272a'
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='#22d3ee'
        strokeWidth={stroke}
        strokeLinecap='round'
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {showLabel && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize='12'
          fontWeight='700'
          fill='#f4f4f5'>
          {percent}%
        </text>
      )}
    </svg>
  );
};

const hudPanelClass = "rounded-lg bg-zinc-950/75 backdrop-blur-md";
const controlButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950/75 text-zinc-300 backdrop-blur-md transition-background hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const findCurrent = (
  layout: ReturnType<typeof layoutSkillRoadmap>,
  tiers: ReturnType<typeof buildSkillRoadmap>,
  progress: ReturnType<typeof computeRoadmapProgress>,
) => {
  for (const layoutTier of layout.tiers) {
    for (const layoutBranch of layoutTier.branches) {
      const node = layoutBranch.nodes.find(
        (n) => progress.states.get(n.id) === "current",
      );
      if (!node) continue;
      const branch = tiers
        .find((t) => t.id === layoutTier.id)
        ?.branches.find((b) => b.id === layoutBranch.id);
      return {
        node,
        tierId: layoutTier.id,
        branchLabel: branch?.label ?? "",
        skillId: branch?.skillId ?? "",
      };
    }
  }
  return null;
};

export const SkillRoadmapView = ({
  progressMap,
  skillLevels,
  isPremium,
  onStartExercise,
  onShowUpgrade,
  onSkillClick,
}: SkillRoadmapViewProps) => {
  const tiers = useMemo(() => buildSkillRoadmap(exercisesAgregat), []);
  const layout = useMemo(() => layoutSkillRoadmap(tiers), [tiers]);
  const exerciseById = useMemo(
    () => new Map(exercisesAgregat.map((e) => [e.id, e])),
    [],
  );

  const progress = useMemo(
    () =>
      computeRoadmapProgress(
        tiers,
        (exercise) => hasExerciseProgress(progressMap.get(exercise.id)),
        (exercise) => !!exercise.premium && !isPremium,
      ),
    [tiers, progressMap, isPremium],
  );

  /** The "up next" dot, the tier it sits in and the branch that names it. */
  const current = findCurrent(layout, tiers, progress);
  const currentExercise = current
    ? exerciseById.get(current.node.id)
    : undefined;

  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState<RoadmapNodeHover | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userZoomedRef = useRef(false);
  const centeredRef = useRef(false);
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const fitToWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    userZoomedRef.current = false;
    const next = clampScale(el.clientWidth / layout.width);
    // Land on the trunk; the map is wider than a phone at the minimum scale.
    pendingScrollRef.current = {
      left: (layout.width * next - el.clientWidth) / 2,
      top: el.scrollTop * (next / scale),
    };
    setScale(next);
  }, [layout.width, scale]);

  // The map fills the panel's width on every resize until the player zooms
  // by hand; from then on their zoom is left alone.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => {
      if (userZoomedRef.current || !el.clientWidth) return;
      fitToWidth();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitToWidth]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pending = pendingScrollRef.current;
    if (!el || !pending) return;
    el.scrollLeft = pending.left;
    el.scrollTop = pending.top;
    pendingScrollRef.current = null;
  }, [scale]);

  /**
   * Zoom around a fixed point: the map pixel under the pointer (or under the
   * middle of the view, for the buttons) stays where it is.
   */
  const zoomTo = useCallback(
    (next: number, anchor?: { clientX: number; clientY: number }) => {
      const el = scrollRef.current;
      const clamped = clampScale(next);
      userZoomedRef.current = true;
      if (el) {
        const rect = el.getBoundingClientRect();
        const ax = anchor ? anchor.clientX - rect.left : el.clientWidth / 2;
        const ay = anchor ? anchor.clientY - rect.top : el.clientHeight / 2;
        const ratio = clamped / scale;
        pendingScrollRef.current = {
          left: (el.scrollLeft + ax) * ratio - ax,
          top: (el.scrollTop + ay) * ratio - ay,
        };
      }
      setScale(clamped);
    },
    [scale],
  );

  // Ctrl+wheel and trackpad pinch zoom the map instead of the browser page;
  // a plain wheel keeps scrolling the map natively.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomTo(scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, zoomTo]);

  const scrollToPoint = useCallback(
    (x: number, y: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({
        left: x * scale - el.clientWidth / 2,
        top: y * scale - el.clientHeight * 0.45,
        behavior,
      });
    },
    [scale],
  );

  const scrollToCurrent = useCallback(() => {
    if (current) scrollToPoint(current.node.x, current.node.y);
  }, [current, scrollToPoint]);

  // A returning player opens the map where they left off; a blank map stays at
  // the start. Runs once, on the first render that has progress loaded.
  useEffect(() => {
    if (centeredRef.current || !current || progressMap.size === 0) return;
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    centeredRef.current = true;
    el.scrollTo({
      left: Math.max(0, (layout.width * scale - el.clientWidth) / 2),
      top: current.node.y * scale - el.clientHeight * 0.45,
    });
  }, [current, progressMap, layout.width, scale]);

  // Mouse drag pans; touch keeps the browser's own scrolling.
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
      moved: false,
    };
    setIsDragging(true);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollRef.current;
    if (!drag || !el) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    el.scrollLeft = drag.left - dx;
    el.scrollTop = drag.top - dy;
  };
  const endDrag = () => {
    if (dragRef.current?.moved) {
      // The click that follows a drag's pointerup must not open a dot; the
      // flag lives exactly that long.
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
    setIsDragging(false);
  };

  /** Arrows pan, +/- zoom, 0 refits — once the map itself has focus. */
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = e.shiftKey ? PAN_STEP * 3 : PAN_STEP;
    const pan = (dx: number, dy: number) => {
      e.preventDefault();
      el.scrollBy({ left: dx, top: dy, behavior: "smooth" });
    };
    switch (e.key) {
      case "ArrowUp":
        pan(0, -step);
        break;
      case "ArrowDown":
        pan(0, step);
        break;
      case "ArrowLeft":
        pan(-step, 0);
        break;
      case "ArrowRight":
        pan(step, 0);
        break;
      case "+":
      case "=":
        e.preventDefault();
        zoomTo(scale * ZOOM_STEP);
        break;
      case "-":
      case "_":
        e.preventDefault();
        zoomTo(scale / ZOOM_STEP);
        break;
      case "0":
        e.preventDefault();
        fitToWidth();
        break;
      default:
        break;
    }
  };

  const handleNodeClick = useCallback(
    (exerciseId: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      const exercise = exerciseById.get(exerciseId);
      if (exercise) setPreviewExercise(exercise);
    },
    [exerciseById],
  );

  const handleBranchClick = useCallback(
    ({ skillId }: { id: string; skillId: string }) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (skillId !== "general") onSkillClick(skillId);
    },
    [onSkillClick],
  );

  const startExercise = useCallback(
    (exercise: Exercise) => {
      if (exercise.premium && !isPremium) {
        onShowUpgrade();
        return;
      }
      onStartExercise(toDashboardExercise(exercise));
    },
    [isPremium, onShowUpgrade, onStartExercise],
  );

  const handleStartPreview = () => {
    if (!previewExercise) return;
    const exercise = previewExercise;
    setPreviewExercise(null);
    startExercise(exercise);
  };

  const hoveredExercise = hovered ? exerciseById.get(hovered.id) : undefined;
  const hoveredState = hovered
    ? (progress.states.get(hovered.id) ?? "available")
    : null;
  const hoveredProgress = hovered ? progressMap.get(hovered.id) : undefined;
  const hoveredStages = hoveredExercise
    ? generateBpmStages(hoveredExercise.metronomeSpeed)
    : [];
  // The card is placed in viewport coordinates, so it is never clipped by the
  // map's own scrolling: it flips below the dot near the top edge and stays
  // clear of both side edges.
  const tooltipBelow = !!hovered && hovered.screenY < 210;
  const tooltipLeft =
    hovered && typeof window !== "undefined"
      ? Math.min(Math.max(hovered.screenX, 124), window.innerWidth - 124)
      : 0;

  const percent =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className='relative h-full w-full overflow-hidden bg-[#0b0b10]'>
      {/* Ambient backdrop: the optional artwork under a wash of colour, else a
          near-black sky the map's own stars sit on. */}
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        {SKILL_ROADMAP_BACKDROP_SRC && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={SKILL_ROADMAP_BACKDROP_SRC}
            alt=''
            className='h-full w-full object-cover opacity-50'
          />
        )}
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.10),transparent_55%)]' />
      </div>

      <div
        ref={scrollRef}
        tabIndex={0}
        role='application'
        aria-label='Skill roadmap, drag to pan'
        className={cn(
          // The map is navigated by dragging, the zoom buttons and the tier
          // list, so the bars themselves are hidden on every engine.
          "relative h-full w-full overflow-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ touchAction: "pan-x pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onKeyDown={handleKeyDown}>
        <div
          className='relative mx-auto'
          style={{
            width: layout.width * scale,
            height: layout.height * scale,
          }}>
          <SkillRoadmapTree
            tiers={tiers}
            layout={layout}
            progress={progress}
            hoveredId={hovered?.id ?? null}
            onNodeHover={setHovered}
            onNodeClick={handleNodeClick}
            onBranchClick={handleBranchClick}
            skillLevels={skillLevels}
          />
        </div>
      </div>

      {/* The map dissolves into the page instead of ending on a hard edge. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#0b0b10] to-transparent'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b10] via-[#0b0b10]/70 to-transparent lg:h-16 lg:via-transparent'
      />

      {/* Overall progress: the full panel on a desktop, a pill on a phone. */}
      <div
        className={cn(
          hudPanelClass,
          "absolute right-4 top-4 hidden w-56 flex-col gap-4 p-4 md:flex",
        )}>
        <div className='flex items-center gap-4'>
          <ProgressRing percent={percent} size={56} stroke={5} showLabel />
          <div>
            <p className='text-sm font-bold text-zinc-100'>
              {progress.completed} / {progress.total}
            </p>
            <p className='text-xs text-zinc-400'>exercises completed</p>
          </div>
        </div>
        <ul className='flex flex-col gap-2'>
          {LEGEND.map(({ state, className: dot }) => (
            <li
              key={state}
              className='flex items-center gap-2 text-xs text-zinc-300'>
              <span
                className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", dot)}
              />
              {STATE_LABEL[state]}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          hudPanelClass,
          "absolute right-4 top-4 flex items-center gap-2 px-3 py-2 md:hidden",
        )}>
        <ProgressRing percent={percent} size={26} stroke={3} />
        <span className='text-xs font-bold tabular-nums text-zinc-100'>
          {progress.completed}
          <span className='font-medium text-zinc-500'>/{progress.total}</span>
        </span>
      </div>

      {/* Continue: always reachable, and it never covers the map. */}
      {currentExercise && current && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className={cn(
            hudPanelClass,
            "absolute bottom-[4.5rem] left-4 right-16 p-3 sm:right-auto sm:w-72 lg:bottom-4",
          )}>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-[11px] font-bold text-cyan-400'>Up next</p>
            <button
              type='button'
              onClick={scrollToCurrent}
              className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-zinc-400 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-200'>
              <Crosshair className='h-3 w-3' />
              Show on map
            </button>
          </div>
          <p className='mt-1 text-[13px] font-bold leading-snug text-zinc-100'>
            {currentExercise.title}
          </p>
          {current.branchLabel && (
            <p className='mt-0.5 truncate text-[11px] text-zinc-500'>
              {current.branchLabel}
              {!!skillLevels[current.skillId] && (
                <span className='tabular-nums'>
                  {" · "}Lvl {skillLevels[current.skillId]}
                </span>
              )}
            </p>
          )}
          <div className='mt-3 flex items-center justify-between gap-2'>
            <Chip
              color='custom'
              style={getChipCustomStyle(
                DIFFICULTY_HEX[currentExercise.difficulty],
              )}
              className='px-2 py-0.5 text-[11px] capitalize'>
              {currentExercise.difficulty}
            </Chip>
            <button
              type='button'
              onClick={() => startExercise(currentExercise)}
              className='flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
              <ChevronRight size={14} strokeWidth={2.5} />
              Start
            </button>
          </div>
        </motion.div>
      )}

      <div className='absolute bottom-[4.5rem] right-4 flex flex-col gap-2 lg:bottom-4'>
        <button
          type='button'
          className={controlButtonClass}
          onClick={() => zoomTo(scale * ZOOM_STEP)}
          aria-label='Zoom in'>
          <Plus className='h-4 w-4' />
        </button>
        <button
          type='button'
          className={controlButtonClass}
          onClick={() => zoomTo(scale / ZOOM_STEP)}
          aria-label='Zoom out'>
          <Minus className='h-4 w-4' />
        </button>
        <button
          type='button'
          className={controlButtonClass}
          onClick={fitToWidth}
          aria-label='Fit the map to the screen'>
          <Maximize2 className='h-4 w-4' />
        </button>
      </div>

      {hovered && hoveredExercise && hoveredState && !isDragging && (
        <div
          className={cn(
            "pointer-events-none fixed z-50 w-60 rounded-lg bg-zinc-950/95 p-3 backdrop-blur-md",
            tooltipBelow
              ? "-translate-x-1/2"
              : "-translate-x-1/2 -translate-y-full",
          )}
          style={{
            left: tooltipLeft,
            top: tooltipBelow ? hovered.screenY + 18 : hovered.screenY - 18,
          }}>
          <p className='text-[13px] font-bold leading-snug text-zinc-100'>
            {hoveredExercise.title}
          </p>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Chip
              color='custom'
              style={getChipCustomStyle(
                DIFFICULTY_HEX[hoveredExercise.difficulty],
              )}
              className='px-2 py-0.5 text-[11px] capitalize'>
              {hoveredExercise.difficulty}
            </Chip>
            <span
              className={cn(
                "text-[11px] font-semibold",
                hoveredState === "completed" && "text-emerald-400",
                hoveredState === "current" && "text-cyan-400",
                hoveredState === "locked" && "text-amber-400",
                hoveredState === "available" && "text-zinc-400",
              )}>
              {STATE_LABEL[hoveredState]}
            </span>
          </div>
          {hoveredStages.length > 0 &&
            (hoveredProgress?.completedBpms?.length ?? 0) > 0 && (
              <p className='mt-2 text-[11px] text-zinc-400'>
                {hoveredProgress?.completedBpms.length} / {hoveredStages.length}{" "}
                BPM stages
              </p>
            )}
          <p className='mt-2 text-[11px] text-zinc-500'>Click to preview</p>
        </div>
      )}

      <ExercisePreviewDialog
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
        onStart={handleStartPreview}
      />
    </div>
  );
};
