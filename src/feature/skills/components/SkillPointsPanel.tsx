import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { buildExerciseFilterHref } from "feature/skills/utils/exerciseFilterQuery";
import { getSkillLevelProgress } from "feature/skills/utils/skillLevel";
import {
  getSkillPointsByCategory,
  type SkillCategoryPoints,
  type SkillPointsEntry,
} from "feature/skills/utils/skillPointsByCategory";
import { useTranslation } from "hooks/useTranslation";
import { Clock } from "lucide-react";
import Link from "next/link";
import { convertMsToHM } from "utils/converter";

interface SkillPointsPanelProps {
  unlockedSkills: UserSkills["unlockedSkills"] | undefined;
  timeSpent?: UserSkills["timeSpent"];
}

/** Pips in a level bar — the same count at every level, so bars line up. */
const LEVEL_BAR_SEGMENTS = 10;

type SkillTheme = ReturnType<typeof getSkillTheme>;

/** Browse Exercises, pre-filtered to the one skill. */
const skillExercisesHref = (skillId: GuitarSkillId) =>
  buildExerciseFilterHref({
    searchQuery: "",
    selectedSkills: [skillId],
    selectedModes: [],
    selectedStatuses: [],
    selectedLength: null,
  });

/** Has the player done anything on this skill yet — points or tracked time. */
const isStarted = (entry: { points: number; timeMs: number }) =>
  entry.points > 0 || entry.timeMs > 0;

/**
 * Total skill points, for the right side of the page's hero — the number the
 * Activity hero gives the player's level.
 */
export const SkillPointsTotal = ({
  unlockedSkills,
  timeSpent,
}: SkillPointsPanelProps) => {
  const { t } = useTranslation("skills");
  const groups = getSkillPointsByCategory(unlockedSkills, timeSpent);
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const skillCount = groups.reduce(
    (sum, group) => sum + group.skills.length,
    0,
  );
  const started = groups.reduce(
    (sum, group) => sum + group.skills.filter(isStarted).length,
    0,
  );

  return (
    <div className='flex flex-col gap-2 md:items-end'>
      <p className='flex items-baseline gap-2 leading-none'>
        <span className='text-6xl font-black tabular-nums tracking-tighter text-white'>
          {total}
        </span>
        <span className='text-sm text-zinc-400'>
          {t("points_panel.total_label")}
        </span>
      </p>
      <p className='text-sm text-zinc-400'>
        {t("points_panel.started", { started, total: skillCount })}
      </p>
    </div>
  );
};

/**
 * Progress through the current level as a row of pips; the last lit pip fills
 * part-way.
 */
const LevelBar = ({
  progress,
  fillClassName,
  label,
}: {
  progress: number;
  fillClassName: string;
  label: string;
}) => (
  <div
    role='progressbar'
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(progress * 100)}
    title={label}
    className='flex min-w-0 flex-1 gap-1'>
    {Array.from({ length: LEVEL_BAR_SEGMENTS }, (_, index) => {
      const fill = Math.min(
        1,
        Math.max(0, progress * LEVEL_BAR_SEGMENTS - index),
      );
      return (
        <div
          key={index}
          className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
          {fill > 0 && (
            <div
              className={cn("h-full", fillClassName)}
              style={{ width: `${fill * 100}%` }}
            />
          )}
        </div>
      );
    })}
  </div>
);

const SkillRow = ({
  entry,
  theme,
}: {
  entry: SkillPointsEntry;
  theme: SkillTheme;
}) => {
  const { t } = useTranslation("skills");
  const { skill, points, timeMs } = entry;
  const { level, progress, nextAt, toNext } = getSkillLevelProgress(points);

  return (
    <li>
      <Link
        href={skillExercisesHref(skill.id)}
        className='group flex items-center gap-5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
        <div className='flex w-10 shrink-0 flex-col items-center'>
          <span className='text-xs font-medium leading-none text-zinc-500'>
            {t("points_panel.lvl")}
          </span>
          <span className='mt-1 text-2xl font-bold leading-none tracking-tight tabular-nums text-zinc-50'>
            {level}
          </span>
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-baseline gap-3'>
            <span className='truncate text-[15px] font-semibold leading-tight text-zinc-100 transition-colors group-hover:text-white group-hover:underline'>
              {t(`skills.${skill.id}.name` as never)}
            </span>
            {timeMs > 0 && (
              <span className='ml-auto flex shrink-0 items-center gap-1.5 self-center text-sm font-semibold tabular-nums text-zinc-100'>
                <Clock aria-hidden className='h-4 w-4 text-zinc-400' />
                {convertMsToHM(timeMs)}
              </span>
            )}
          </div>
          <div className='mt-3 flex items-center gap-4'>
            <LevelBar
              progress={progress}
              fillClassName={theme.glow}
              label={t("points_panel.to_next", {
                count: toNext,
                level: level + 1,
              })}
            />
            <span className='shrink-0 text-xs tabular-nums text-zinc-500'>
              <span className='font-semibold text-zinc-200'>{points}</span> /{" "}
              {nextAt} {t("points_panel.xp")}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
};

const CategoryCard = ({ group }: { group: SkillCategoryPoints }) => {
  const { t } = useTranslation("skills");
  const { category, total, skills } = group;
  const theme = getSkillTheme(category);
  const practised = skills.filter(isStarted);
  const notStarted = skills.filter((entry) => !isStarted(entry));

  return (
    <section className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <header className='flex items-center gap-3'>
        <h2 className='text-lg font-semibold tracking-tight text-zinc-100'>
          {t(`categories.${category}` as never)}
        </h2>
        <span className='ml-auto text-sm tabular-nums text-zinc-500'>
          <span className='text-lg font-semibold text-zinc-100'>{total}</span>{" "}
          {t("points_panel.pts")}
        </span>
      </header>

      {practised.length > 0 ? (
        <ul className='flex flex-col gap-8'>
          {practised.map((entry) => (
            <SkillRow key={entry.skill.id} entry={entry} theme={theme} />
          ))}
        </ul>
      ) : (
        <p className='text-sm text-zinc-400'>
          {t("points_panel.nothing_yet")}
        </p>
      )}

      {notStarted.length > 0 && (
        <div>
          <p className='text-sm text-zinc-500'>
            {t("points_panel.not_started")}
          </p>
          <ul className='mt-2 flex flex-wrap gap-2'>
            {notStarted.map(({ skill }) => (
              <li key={skill.id}>
                <Link
                  href={skillExercisesHref(skill.id)}
                  className='block rounded bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300 shadow-[0_2px_0_0_rgb(9,9,11)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100 active:translate-y-[2px] active:shadow-none'>
                  {t(`skills.${skill.id}.name` as never)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

/**
 * The player's skills grouped by category, each with its level and practice
 * time.
 *
 * A skill's bar is its progress toward the next level (see `skillLevel`), not
 * a share of the strongest skill — so a full bar means a level-up is close, the
 * way an XP bar does. Every skill links to the exercises that train it.
 */
export const SkillPointsPanel = ({
  unlockedSkills,
  timeSpent,
}: SkillPointsPanelProps) => {
  const groups = getSkillPointsByCategory(unlockedSkills, timeSpent);

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {groups.map((group) => (
        <CategoryCard key={group.category} group={group} />
      ))}
    </div>
  );
};
