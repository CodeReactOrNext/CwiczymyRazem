import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { buildExerciseFilterHref } from "feature/skills/utils/exerciseFilterQuery";
import {
  getSkillPointsByCategory,
  type SkillCategoryPoints,
} from "feature/skills/utils/skillPointsByCategory";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { convertMsToHM } from "utils/converter";

interface SkillPointsPanelProps {
  unlockedSkills: UserSkills["unlockedSkills"] | undefined;
  timeSpent?: UserSkills["timeSpent"];
}

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

const percentOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const Summary = ({ groups }: { groups: SkillCategoryPoints[] }) => {
  const { t } = useTranslation("skills");
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
    <section className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-12'>
      <div className='shrink-0'>
        <p className='text-sm text-zinc-400'>Skill points</p>
        <p className='mt-1 text-4xl font-bold tabular-nums text-white'>
          {total}
        </p>
        <p className='mt-1 text-sm text-zinc-400'>
          {started} of {skillCount} skills started
        </p>
      </div>

      <div className='min-w-0 flex-1'>
        {/* Where the points went — one bar, split by category. */}
        <div className='flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-zinc-800/60'>
          {total > 0 &&
            groups.map(({ category, total: categoryTotal }) =>
              categoryTotal > 0 ? (
                <div
                  key={category}
                  className={getSkillTheme(category).glow}
                  style={{ width: `${percentOf(categoryTotal, total)}%` }}
                />
              ) : null,
            )}
        </div>
        <ul className='mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4'>
          {groups.map(({ category, total: categoryTotal }) => (
            <li key={category} className='flex items-center gap-2'>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  getSkillTheme(category).glow,
                )}
              />
              <span className='truncate text-sm text-zinc-300'>
                {t(`categories.${category}` as never)}
              </span>
              <span className='ml-auto text-sm tabular-nums text-zinc-400'>
                {percentOf(categoryTotal, total)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const CategoryCard = ({
  group,
  maxPoints,
}: {
  group: SkillCategoryPoints;
  maxPoints: number;
}) => {
  const { t } = useTranslation("skills");
  const { category, total, skills } = group;
  const theme = getSkillTheme(category);
  const CategoryIcon = SKILL_CATEGORY_ICONS[category];
  const practised = skills.filter(isStarted);
  const notStarted = skills.filter((entry) => !isStarted(entry));

  return (
    <section className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <header className='flex items-center gap-3'>
        <CategoryIcon className={cn("h-5 w-5 shrink-0", theme.primary)} />
        <h2 className='text-base font-semibold text-zinc-100'>
          {t(`categories.${category}` as never)}
        </h2>
        <span className='ml-auto text-sm tabular-nums text-zinc-400'>
          <span className='font-semibold text-zinc-100'>{total}</span> pts
        </span>
      </header>

      {practised.length > 0 ? (
        <ul className='-mx-2 flex flex-col gap-1'>
          {practised.map(({ skill, points, timeMs }) => (
            <li key={skill.id}>
              <Link
                href={skillExercisesHref(skill.id)}
                className='group flex flex-col gap-2 rounded-lg px-2 py-2 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/40'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm text-zinc-200'>
                    {t(`skills.${skill.id}.name` as never)}
                  </span>
                  {/* Time first, points last — the points column lines up
                      down the card, the time reads as the skill's detail. */}
                  {timeMs > 0 && (
                    <span className='ml-auto shrink-0 text-xs tabular-nums text-zinc-400'>
                      {convertMsToHM(timeMs)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-100",
                      timeMs <= 0 && "ml-auto",
                    )}>
                    {points}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className='h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300'
                  />
                </div>
                <div className='mr-6 h-1.5 overflow-hidden rounded-full bg-zinc-800/60'>
                  <div
                    className={cn("h-full rounded-full", theme.glow)}
                    style={{
                      width: `${Math.max(4, (points / maxPoints) * 100)}%`,
                    }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm text-zinc-400'>Nothing practised here yet.</p>
      )}

      {notStarted.length > 0 && (
        <div>
          <p className='text-xs text-zinc-500'>Not started</p>
          <ul className='mt-2 flex flex-wrap gap-1.5'>
            {notStarted.map(({ skill }) => (
              <li key={skill.id}>
                <Link
                  href={skillExercisesHref(skill.id)}
                  className='block rounded bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-200 sm:px-2 sm:py-1'>
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
 * The player's points and practice time per skill, grouped by category.
 *
 * Bars are scaled against the single strongest skill across all categories,
 * so a long bar in Theory and a long bar in Technique mean the same thing.
 * Every skill links to the exercises that train it.
 */
export const SkillPointsPanel = ({
  unlockedSkills,
  timeSpent,
}: SkillPointsPanelProps) => {
  const groups = getSkillPointsByCategory(unlockedSkills, timeSpent);
  const maxPoints = Math.max(
    1,
    ...groups.flatMap((group) => group.skills.map((entry) => entry.points)),
  );

  return (
    <div className='flex flex-col gap-4'>
      <Summary groups={groups} />
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {groups.map((group) => (
          <CategoryCard
            key={group.category}
            group={group}
            maxPoints={maxPoints}
          />
        ))}
      </div>
    </div>
  );
};
