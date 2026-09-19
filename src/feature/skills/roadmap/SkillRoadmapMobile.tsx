import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { Check, ChevronDown, Crosshair, Lock, Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { RoadmapBranch, RoadmapTier } from "./skillRoadmap.data";
import { buildSkillRoadmap } from "./skillRoadmap.data";
import { DIFFICULTY_HEX, toDashboardExercise } from "./skillRoadmapChallenge";
import type { RoadmapNodeState, RoadmapProgress } from "./skillRoadmapStates";
import {
  computeRoadmapProgress,
  findCurrentPlacement,
} from "./skillRoadmapStates";

interface SkillRoadmapMobileProps {
  progressMap: Map<string, BpmProgressData>;
  /** Level per skill id — a branch is a skill, so it is shown on the branch. */
  skillLevels: Record<string, number>;
  isPremium: boolean;
  onStartExercise: (challenge: DashboardExercise) => void;
  onShowUpgrade: () => void;
}

/**
 * The roadmap on a phone.
 *
 * The desktop map is a thousand-unit-wide drawing that has to be panned and
 * pinched; none of that survives a touch screen, so the same journey is laid
 * out here as what it actually is — an ordered list. Tiers are sticky headings,
 * branches are rows that open in place, and an exercise is a row you tap. There
 * is no zoom, no drag and no hover: everything is reachable with one thumb.
 */
const TIER_NUMBER = (index: number) => String(index + 1).padStart(2, "0");

const branchDomId = (branchId: string) => `skill-branch-${branchId}`;
const tierDomId = (tierId: string) => `skill-tier-${tierId}`;

/** Smooth-scrolls after the click's re-render, so it aims at the final layout. */
const scrollToElement = (id: string, block: ScrollLogicalPosition) => {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block });
  });
};

const countCompleted = (
  branch: RoadmapBranch,
  states: Map<string, RoadmapNodeState>,
) => branch.exercises.filter((e) => states.get(e.id) === "completed").length;

/** A thin bar rather than a number, for the counts that are already spelled out. */
const ProgressBar = ({
  share,
  className,
}: {
  share: number;
  className?: string;
}) => (
  <span
    className={cn(
      "block h-1 overflow-hidden rounded-full bg-zinc-800",
      className,
    )}>
    <span
      className='block h-full rounded-full bg-emerald-500 transition-[width] duration-500'
      style={{ width: `${Math.round(share * 100)}%` }}
    />
  </span>
);

/**
 * The four states an exercise can be in, as a 20px mark. Same language as the
 * desktop map: done is filled, next is ringed, locked wears the padlock.
 */
const StateMark = ({ state }: { state: RoadmapNodeState }) => {
  if (state === "completed") {
    return (
      <span
        aria-hidden='true'
        className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950'>
        <Check className='h-3 w-3' strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        aria-hidden='true'
        className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-cyan-400'>
        <span className='h-1.5 w-1.5 rounded-full bg-cyan-400' />
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span
        aria-hidden='true'
        className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-amber-500'>
        <Lock className='h-2.5 w-2.5' />
      </span>
    );
  }
  return (
    <span
      aria-hidden='true'
      className='h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-zinc-700'
    />
  );
};

const STATE_WORD: Record<RoadmapNodeState, string> = {
  completed: "completed",
  current: "up next",
  available: "not started",
  locked: "Pro exercise",
};

/** One branch: a row that opens to its exercises without leaving the page. */
const BranchRow = ({
  branch,
  level,
  states,
  isOpen,
  onToggle,
  onPickExercise,
}: {
  branch: RoadmapBranch;
  level?: number;
  states: Map<string, RoadmapNodeState>;
  isOpen: boolean;
  onToggle: () => void;
  onPickExercise: (exercise: Exercise) => void;
}) => {
  const total = branch.exercises.length;
  const done = countCompleted(branch, states);
  const holdsCurrent = branch.exercises.some(
    (e) => states.get(e.id) === "current",
  );
  const panelId = `${branchDomId(branch.id)}-panel`;

  return (
    <div
      id={branchDomId(branch.id)}
      className={cn(
        "scroll-mt-16 overflow-hidden rounded-xl transition-background",
        isOpen ? "bg-zinc-800/40" : "bg-zinc-900/40",
      )}>
      <button
        type='button'
        onClick={onToggle}
        aria-expanded={isOpen}
        // The panel only exists while it is open, so the reference only holds
        // while it does.
        aria-controls={isOpen ? panelId : undefined}
        className='flex w-full items-center gap-3 px-4 py-3.5 text-left'>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-semibold text-zinc-100'>
            {branch.label}
          </span>
          <span className='mt-2 flex items-center gap-2.5'>
            <ProgressBar
              share={total > 0 ? done / total : 0}
              className='w-16'
            />
            <span className='text-[11px] tabular-nums text-zinc-500'>
              {done} of {total}
            </span>
            {!!level && (
              <span className='text-[11px] tabular-nums text-zinc-600'>
                Lvl {level}
              </span>
            )}
            {holdsCurrent && (
              <span className='text-[11px] font-semibold text-cyan-400'>
                Up next
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          aria-hidden='true'
          className={cn(
            "h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <ul id={panelId} className='px-2 pb-2'>
          {branch.exercises.map((exercise) => {
            const state = states.get(exercise.id) ?? "available";
            return (
              <li key={exercise.id}>
                <button
                  type='button'
                  onClick={() => onPickExercise(exercise)}
                  className='flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-background active:bg-zinc-700/40'>
                  <StateMark state={state} />
                  <span className='min-w-0 flex-1'>
                    <span
                      className={cn(
                        "block truncate text-[13px] leading-snug",
                        state === "completed"
                          ? "text-zinc-400"
                          : "text-zinc-100",
                      )}>
                      {exercise.title}
                    </span>
                    <span className='sr-only'>{STATE_WORD[state]}</span>
                  </span>
                  <span
                    className='flex-shrink-0 text-[11px] font-medium capitalize'
                    style={{ color: DIFFICULTY_HEX[exercise.difficulty] }}>
                    {exercise.difficulty}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/** One tier: a sticky heading the eye can hold on to while its branches scroll. */
const TierSection = ({
  tier,
  index,
  progress,
  skillLevels,
  openBranchId,
  onToggleBranch,
  onPickExercise,
}: {
  tier: RoadmapTier;
  index: number;
  progress: RoadmapProgress;
  skillLevels: Record<string, number>;
  openBranchId: string | null;
  onToggleBranch: (branchId: string) => void;
  onPickExercise: (exercise: Exercise) => void;
}) => {
  const stats = progress.byTier.get(tier.id) ?? { completed: 0, total: 0 };
  const share = stats.total > 0 ? stats.completed / stats.total : 0;

  return (
    <section id={tierDomId(tier.id)} className='scroll-mt-0'>
      <header className='sticky top-0 z-20 bg-second-600/95 px-4 pb-2.5 pt-4 backdrop-blur-sm'>
        <h2 className='flex items-baseline gap-2.5'>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              stats.completed > 0 ? "text-zinc-400" : "text-zinc-600",
            )}>
            {TIER_NUMBER(index)}
          </span>
          <span className='min-w-0 flex-1 truncate text-base font-bold text-zinc-100'>
            {tier.title}
          </span>
          <span className='text-xs tabular-nums text-zinc-500'>
            {stats.completed}/{stats.total}
          </span>
        </h2>
        <ProgressBar share={share} className='mt-2.5' />
      </header>

      <p className='px-4 pb-3 pt-3 text-xs leading-relaxed text-zinc-500'>
        {tier.subtitle}
      </p>

      <div className='space-y-2 px-4 pb-6'>
        {tier.branches.map((branch) => (
          <BranchRow
            key={branch.id}
            branch={branch}
            level={skillLevels[branch.skillId]}
            states={progress.states}
            isOpen={openBranchId === branch.id}
            onToggle={() => onToggleBranch(branch.id)}
            onPickExercise={onPickExercise}
          />
        ))}
      </div>
    </section>
  );
};

export const SkillRoadmapMobile = ({
  progressMap,
  skillLevels,
  isPremium,
  onStartExercise,
  onShowUpgrade,
}: SkillRoadmapMobileProps) => {
  const tiers = useMemo(() => buildSkillRoadmap(exercisesAgregat), []);
  const progress = useMemo(
    () =>
      computeRoadmapProgress(
        tiers,
        (exercise) => hasExerciseProgress(progressMap.get(exercise.id)),
        (exercise) => !!exercise.premium && !isPremium,
      ),
    [tiers, progressMap, isPremium],
  );

  const current = findCurrentPlacement(tiers, progress.states);

  // Nothing is open to begin with: the player lands on the whole path at a
  // glance, and "up next" is already spelled out at the top.
  const [openBranchId, setOpenBranchId] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

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

  const toggleBranch = (branchId: string) =>
    setOpenBranchId((open) => (open === branchId ? null : branchId));

  /** Opens the branch the next exercise lives on and scrolls the page to it. */
  const showCurrentInPath = () => {
    if (!current) return;
    setOpenBranchId(current.branch.id);
    scrollToElement(branchDomId(current.branch.id), "center");
  };

  const percent =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className='mx-auto w-full max-w-2xl'>
      <div className='px-4 pt-4'>
        {current && (
          <div className='rounded-xl bg-zinc-900/60 p-4'>
            <p className='text-[11px] font-bold text-cyan-400'>Up next</p>
            <p className='mt-1.5 text-lg font-bold leading-snug text-zinc-100'>
              {current.exercise.title}
            </p>
            <p className='mt-1 flex items-baseline gap-2 text-xs text-zinc-500'>
              <span className='min-w-0 truncate'>
                {current.tier.title} · {current.branch.label}
              </span>
              <span
                className='flex-shrink-0 font-medium capitalize'
                style={{ color: DIFFICULTY_HEX[current.exercise.difficulty] }}>
                {current.exercise.difficulty}
              </span>
            </p>
            <div className='mt-4 flex items-center gap-2'>
              <button
                type='button'
                onClick={() => startExercise(current.exercise)}
                className='flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-100 text-sm font-bold text-zinc-950 transition-background active:bg-white'>
                <Play className='h-4 w-4' fill='currentColor' />
                Start
              </button>
              <button
                type='button'
                onClick={showCurrentInPath}
                aria-label='Show this exercise in the path'
                className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-background active:bg-zinc-700'>
                <Crosshair className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}

        <div className='mt-4 flex items-center gap-3'>
          <ProgressBar
            share={progress.total > 0 ? progress.completed / progress.total : 0}
            className='flex-1'
          />
          <span className='text-xs font-semibold tabular-nums text-zinc-400'>
            {progress.completed}
            <span className='text-zinc-600'>/{progress.total}</span>
          </span>
          <span className='text-xs tabular-nums text-zinc-600'>{percent}%</span>
        </div>

        {/* Seven tiers is more than a thumb wants to scroll past, so each one
            is also one tap away from the top of the page. */}
        <nav
          aria-label='Jump to a tier'
          className='-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {tiers.map((tier, index) => {
            const stats = progress.byTier.get(tier.id) ?? {
              completed: 0,
              total: 0,
            };
            return (
              <button
                key={tier.id}
                type='button'
                onClick={() => scrollToElement(tierDomId(tier.id), "start")}
                className='flex h-11 flex-shrink-0 items-center gap-2 rounded-lg bg-zinc-900/60 px-3 transition-background active:bg-zinc-800'>
                <span className='text-[11px] tabular-nums text-zinc-600'>
                  {TIER_NUMBER(index)}
                </span>
                <span className='text-xs font-semibold text-zinc-300'>
                  {tier.title}
                </span>
                <span className='text-[11px] tabular-nums text-zinc-600'>
                  {stats.completed}/{stats.total}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {tiers.map((tier, index) => (
        <TierSection
          key={tier.id}
          tier={tier}
          index={index}
          progress={progress}
          skillLevels={skillLevels}
          openBranchId={openBranchId}
          onToggleBranch={toggleBranch}
          onPickExercise={setPreviewExercise}
        />
      ))}

      <p className='px-4 pb-8 text-center text-xs text-zinc-600'>
        {progress.completed === progress.total
          ? "Mastery — every exercise on the path is done."
          : `Mastery · ${progress.total - progress.completed} exercises to go`}
      </p>

      <ExercisePreviewDialog
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
        onStart={handleStartPreview}
      />
    </div>
  );
};
