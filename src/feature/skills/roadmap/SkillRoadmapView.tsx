import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { useTranslation } from "hooks/useTranslation";
import { Maximize2, Minus, Plus } from "lucide-react";
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
  completed: "roadmap.state.completed",
  current: "roadmap.state.current",
  available: "roadmap.state.available",
  locked: "roadmap.state.locked",
};

const controlButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950/75 text-zinc-300 backdrop-blur-md transition-background hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const findCurrentNode = (
  layout: ReturnType<typeof layoutSkillRoadmap>,
  progress: ReturnType<typeof computeRoadmapProgress>,
) => {
  for (const layoutTier of layout.tiers) {
    for (const layoutBranch of layoutTier.branches) {
      const node = layoutBranch.nodes.find(
        (n) => progress.states.get(n.id) === "current",
      );
      if (node) return node;
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
  const { t } = useTranslation(["skills", "common"]);
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

  /** The "up next" dot — a returning player opens the map on it. */
  const currentNode = findCurrentNode(layout, progress);

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

  // A returning player opens the map where they left off; a blank map stays at
  // the start. Runs once, on the first render that has progress loaded.
  useEffect(() => {
    if (centeredRef.current || !currentNode || progressMap.size === 0) return;
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    centeredRef.current = true;
    el.scrollTo({
      left: Math.max(0, (layout.width * scale - el.clientWidth) / 2),
      top: currentNode.y * scale - el.clientHeight * 0.45,
    });
  }, [currentNode, progressMap, layout.width, scale]);

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
      onSkillClick(skillId);
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

  return (
    <div className='relative h-full w-full overflow-hidden bg-zinc-950'>
      {/* Flat ground, with the optional artwork underneath when set. */}
      {SKILL_ROADMAP_BACKDROP_SRC && (
        <div
          className='pointer-events-none absolute inset-0'
          aria-hidden='true'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SKILL_ROADMAP_BACKDROP_SRC}
            alt=''
            className='h-full w-full object-cover opacity-50'
          />
        </div>
      )}

      <div
        ref={scrollRef}
        tabIndex={0}
        role='application'
        aria-label={t("roadmap.drag_aria")}
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
            scale={scale}
          />
        </div>
      </div>

      {/* The map dissolves into the page instead of ending on a hard edge. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-zinc-950 to-transparent'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent lg:h-16 lg:via-transparent'
      />

      <div className='absolute bottom-[4.5rem] right-4 flex flex-col gap-2 lg:bottom-4'>
        <button
          type='button'
          className={controlButtonClass}
          onClick={() => zoomTo(scale * ZOOM_STEP)}
          aria-label={t("roadmap.zoom_in")}>
          <Plus className='h-4 w-4' />
        </button>
        <button
          type='button'
          className={controlButtonClass}
          onClick={() => zoomTo(scale / ZOOM_STEP)}
          aria-label={t("roadmap.zoom_out")}>
          <Minus className='h-4 w-4' />
        </button>
        <button
          type='button'
          className={controlButtonClass}
          onClick={fitToWidth}
          aria-label={t("roadmap.fit")}>
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
              {t(`common:difficulty.${hoveredExercise.difficulty}`, hoveredExercise.difficulty)}
            </Chip>
            <span
              className={cn(
                "text-[11px] font-semibold",
                hoveredState === "completed" && "text-emerald-400",
                hoveredState === "current" && "text-cyan-400",
                hoveredState === "locked" && "text-amber-400",
                hoveredState === "available" && "text-zinc-400",
              )}>
              {t(STATE_LABEL[hoveredState])}
            </span>
          </div>
          {hoveredStages.length > 0 &&
            (hoveredProgress?.completedBpms?.length ?? 0) > 0 && (
              <p className='mt-2 text-[11px] text-zinc-400'>
                {t("roadmap.bpm_stages", {
                  done: hoveredProgress?.completedBpms.length ?? 0,
                  total: hoveredStages.length,
                })}
              </p>
            )}
          <p className='mt-2 text-[11px] text-zinc-500'>
            {t("roadmap.click_preview")}
          </p>
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
