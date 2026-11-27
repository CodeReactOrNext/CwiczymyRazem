import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { SKILL_CATEGORY_ORDER } from "feature/skills/utils/skillPointsByCategory";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";

import { categoryTone, TONE_CLASSES } from "./helpers/categoryTone";
import type { SkillMinutes } from "./helpers/sessionSkills";
import { formatPracticed, MINUTE_MS } from "./helpers/sessionSongs";
import { CategoryBadge } from "./ReportFlowParts";

type GuitarSkill = (typeof guitarSkills)[number];

interface SessionSkillPickerProps {
  value: SkillMinutes;
  /** Picks a skill (at 0 min) or drops it. */
  onToggle: (skillId: string) => void;
  /**
   * The time block of a picked skill, drawn right under its category's chips.
   * Desktop passes it so the time shows up where the player just clicked — a
   * separate list under all four categories went unnoticed. Phones leave it
   * out: there the minutes are the next screen.
   */
  renderPicked?: (skill: GuitarSkill) => ReactNode;
}

/**
 * "What did you work on?", answered by skill instead of by category: tap the
 * skills, any number of them. Each picked skill gets the same time block a
 * category or a song does.
 */
const SessionSkillPicker = ({
  value,
  onToggle,
  renderPicked,
}: SessionSkillPickerProps) => {
  const { t } = useTranslation("skills");

  return (
    <div className='flex flex-col gap-4'>
      {SKILL_CATEGORY_ORDER.map((category) => {
        const skills = guitarSkills.filter((skill) => skill.category === category);
        const picked = skills.filter((skill) => skill.id in value);
        const categoryMinutes = picked.reduce(
          (sum, skill) => sum + (value[skill.id] ?? 0),
          0,
        );

        return (
          <section
            key={category}
            className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              <CategoryBadge
                category={category}
                size='sm'
                active={categoryMinutes > 0}
              />
              <h3 className='min-w-0 flex-1 text-base font-semibold text-zinc-100'>
                {t(`categories.${category}` as never)}
              </h3>
              {categoryMinutes > 0 && (
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    TONE_CLASSES[categoryTone(category)].number,
                  )}>
                  {formatPracticed(categoryMinutes * MINUTE_MS)}
                </span>
              )}
            </div>

            <div className='flex flex-wrap gap-2.5'>
              {skills.map((skill) => {
                const isPicked = skill.id in value;
                const minutes = value[skill.id] ?? 0;
                return (
                  <button
                    key={skill.id}
                    type='button'
                    aria-pressed={isPicked}
                    onClick={() => onToggle(skill.id)}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isPicked
                        ? "bg-zinc-100 text-zinc-950"
                        : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white",
                    )}>
                    {t(`skills.${skill.id}.name` as never)}
                    {isPicked && minutes > 0 && (
                      <span className='rounded-md bg-zinc-950/10 px-1.5 py-0.5 text-xs font-bold tabular-nums'>
                        {formatPracticed(minutes * MINUTE_MS)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {renderPicked && picked.length > 0 && (
              <div className='flex flex-col gap-3'>
                {picked.map((skill) => renderPicked(skill))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default SessionSkillPicker;
