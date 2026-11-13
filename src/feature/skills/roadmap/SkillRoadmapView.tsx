import { Button } from "assets/components/ui/button";
import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { useTranslation } from "hooks/useTranslation";
import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildSkillRoadmap,
  SKILL_ROADMAP_BACKDROP_SRC,
} from "./skillRoadmap.data";
import { DIFFICULTY_HEX, toDashboardExercise } from "./skillRoadmapChallenge";
import {
  clampRoadmapWidth,
  layoutSkillRoadmap,
  ROADMAP_GEOMETRY,
} from "./skillRoadmapLayout";
import {
  computeRoadmapProgress,
  findCurrentPlacement,
  type RoadmapNodeState,
} from "./skillRoadmapStates";
import {
  type RoadmapBubbleInfo,
  type RoadmapNodeHover,
  SkillRoadmapTree,
} from "./SkillRoadmapTree";

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

const STATE_LABEL: Record<RoadmapNodeState, string> = {
  completed: "roadmap.state.completed",
  current: "roadmap.state.current",
  available: "roadmap.state.available",
  locked: "roadmap.state.locked",
};

const STATE_CLASS: Record<RoadmapNodeState, string> = {
  completed: "text-emerald-400",
  current: "text-cyan-400",
  available: "text-zinc-400",
  locked: "text-amber-400",
};

/** Room the scrolling panel keeps either side of the map. */
const PANEL_PADDING = 24;

const LEGEND: { key: string; swatch: string }[] = [
  { key: "roadmap.state.completed", swatch: "bg-emerald-500" },
  { key: "roadmap.state.current", swatch: "bg-cyan-500" },
  { key: "roadmap.legend_way_in", swatch: "bg-zinc-600" },
  { key: "roadmap.legend_later", swatch: "bg-zinc-800" },
];

export const SkillRoadmapView = ({
  progressMap,
  skillLevels,
  isPremium,
  onStartExercise,
  onShowUpgrade,
  onSkillClick,
}: SkillRoadmapViewProps) => {
  const { t } = useTranslation(["skills", "common"]);
  const localizeExercise = useLocalizeExercise();
  const tiers = useMemo(() => buildSkillRoadmap(exercisesAgregat), []);
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

  /** The "up next" exercise — the map opens on it, with its bubble open. */
  const currentId = useMemo(
    () => findCurrentPlacement(tiers, progress.states)?.exercise.id ?? null,
    [tiers, progress.states],
  );

  const [width, setWidth] = useState<number>(ROADMAP_GEOMETRY.maxWidth);
  // `undefined` until the player picks something: the pick then follows "up next".
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const [foldedTierIds, setFoldedTierIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [hovered, setHovered] = useState<RoadmapNodeHover | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const selectedId = picked === undefined ? currentId : picked;

  const layout = useMemo(
    () =>
      layoutSkillRoadmap(tiers, {
        width,
        selectedId,
        currentId,
        foldedTierIds,
      }),
    [tiers, width, selectedId, currentId, foldedTierIds],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);

  // The map follows the panel: a narrower panel gets shorter rows, not a
  // scaled-down drawing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth) return;
      setWidth(clampRoadmapWidth(el.clientWidth - PANEL_PADDING * 2));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A returning player opens the map where they left off; a blank map stays at
  // the start. Runs once, on the first render that has progress loaded.
  useEffect(() => {
    if (centeredRef.current || !currentId || progressMap.size === 0) return;
    const el = scrollRef.current;
    if (!el || !el.clientHeight) return;
    const key = el.querySelector<HTMLElement>(
      `[data-exercise-id="${CSS.escape(currentId)}"]`,
    );
    if (!key) return;
    centeredRef.current = true;
    const offset =
      key.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTo({ top: el.scrollTop + offset - el.clientHeight * 0.35 });
  }, [currentId, progressMap, layout]);

  const handleNodeSelect = useCallback(
    (exerciseId: string) => {
      setHovered(null);
      setPicked(exerciseId === selectedId ? null : exerciseId);
    },
    [selectedId],
  );

  const handleBranchClick = useCallback(
    ({ skillId }: { id: string; skillId: string }) => onSkillClick(skillId),
    [onSkillClick],
  );

  const handleTierToggle = useCallback((tierId: string) => {
    setFoldedTierIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(tierId)) next.add(tierId);
      return next;
    });
  }, []);

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

  const exerciseTitle = useCallback(
    (exerciseId: string) => {
      const exercise = exerciseById.get(exerciseId);
      return exercise ? localizeExercise(exercise).title : exerciseId;
    },
    [exerciseById, localizeExercise],
  );

  /** Under the picked key: what it is, how it stands, and the way in. */
  const renderBubble = useCallback(
    ({ exerciseId, position, count, branchLabel }: RoadmapBubbleInfo) => {
      const exercise = exerciseById.get(exerciseId);
      if (!exercise) return null;
      const state = progress.states.get(exerciseId) ?? "available";
      return (
        <div className='flex h-full items-center gap-3 rounded-lg bg-zinc-900 px-5'>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-xs tabular-nums text-zinc-500'>
              {branchLabel} ·{" "}
              {t("roadmap.done_of", { done: position, total: count })} ·{" "}
              {t(
                `common:difficulty.${exercise.difficulty}`,
                exercise.difficulty,
              )}
            </p>
            <p className='truncate text-[15px] font-semibold leading-snug text-zinc-100'>
              {localizeExercise(exercise).title}
            </p>
            <p className={cn("text-[13px]", STATE_CLASS[state])}>
              {t(STATE_LABEL[state])}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='shrink-0'
            aria-label={t("roadmap.preview")}
            onClick={() => setPreviewExercise(exercise)}>
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            size='sm'
            className='shrink-0'
            onClick={() => startExercise(exercise)}>
            {t(state === "completed" ? "roadmap.play_again" : "roadmap.start")}
          </Button>
        </div>
      );
    },
    [exerciseById, progress.states, t, localizeExercise, startExercise],
  );

  const hoveredExercise = hovered ? exerciseById.get(hovered.id) : undefined;
  const hoveredState = hovered
    ? (progress.states.get(hovered.id) ?? "available")
    : null;
  const hoveredProgress = hovered ? progressMap.get(hovered.id) : undefined;
  const hoveredStages = hoveredExercise
    ? generateBpmStages(hoveredExercise.metronomeSpeed)
    : [];
  // The card is placed in viewport coordinates, so it is never clipped by the
  // map's own scrolling: it flips below the key near the top edge and stays
  // clear of both side edges.
  const tooltipBelow = !!hovered && hovered.screenY < 210;
  const tooltipLeft =
    hovered && typeof window !== "undefined"
      ? Math.min(Math.max(hovered.screenX, 124), window.innerWidth - 124)
      : 0;
  const share = progress.total > 0 ? progress.completed / progress.total : 0;

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
        className='relative h-full w-full overflow-auto overscroll-contain'
        style={{ paddingInline: PANEL_PADDING }}>
        <div
          className='mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-3 pt-6'
          style={{ width: layout.width }}>
          <div className='flex items-center gap-3 text-[13px] tabular-nums text-zinc-400'>
            <div className='h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800'>
              <div
                className='h-full rounded-full bg-emerald-500'
                style={{ width: `${share * 100}%` }}
              />
            </div>
            <span>
              {t("roadmap.exercises_done", {
                done: progress.completed,
                total: progress.total,
              })}
            </span>
          </div>
          <ul className='flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400'>
            {LEGEND.map(({ key, swatch }) => (
              <li key={key} className='flex items-center gap-2'>
                <span className={cn("h-3 w-3 rounded-full", swatch)} />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <SkillRoadmapTree
          tiers={tiers}
          layout={layout}
          progress={progress}
          selectedId={selectedId}
          onNodeHover={setHovered}
          onNodeSelect={handleNodeSelect}
          onBranchClick={handleBranchClick}
          onTierToggle={handleTierToggle}
          skillLevels={skillLevels}
          exerciseTitle={exerciseTitle}
          renderBubble={renderBubble}
        />
      </div>

      {/* The map dissolves into the page instead of ending on a hard edge. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent'
      />

      {hovered && hoveredExercise && hoveredState && (
        <div
          className={cn(
            "pointer-events-none fixed z-50 w-60 rounded-lg bg-zinc-950/95 p-3 backdrop-blur-md",
            tooltipBelow
              ? "-translate-x-1/2"
              : "-translate-x-1/2 -translate-y-full",
          )}
          style={{
            left: tooltipLeft,
            top: tooltipBelow ? hovered.screenY + 28 : hovered.screenY - 28,
          }}>
          <p className='text-[13px] font-bold leading-snug text-zinc-100'>
            {localizeExercise(hoveredExercise).title}
          </p>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Chip
              color='custom'
              style={getChipCustomStyle(
                DIFFICULTY_HEX[hoveredExercise.difficulty],
              )}
              className='px-2 py-0.5 text-[11px] capitalize'>
              {t(
                `common:difficulty.${hoveredExercise.difficulty}`,
                hoveredExercise.difficulty,
              )}
            </Chip>
            <span
              className={cn(
                "text-[11px] font-semibold",
                STATE_CLASS[hoveredState],
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
