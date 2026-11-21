import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { SKILL_CATEGORY_ORDER } from "feature/skills/utils/skillPointsByCategory";
import { useTranslation } from "hooks/useTranslation";

import type { SkillMinutes } from "./helpers/sessionSkills";
import { CategoryBadge } from "./ReportFlowParts";

interface SessionSkillPickerProps {
  value: SkillMinutes;
  /** Picks a skill (at 0 min) or drops it. */
  onToggle: (skillId: string) => void;
}

/**
 * "What did you work on?", answered by skill instead of by category: tap the
 * skills, any number of them. Their minutes are the next question's job — each
 * picked skill gets the same time block a category or a song does.
 */
const SessionSkillPicker = ({ value, onToggle }: SessionSkillPickerProps) => {
  const { t } = useTranslation("skills");

  return (
    <div className='flex flex-col gap-3'>
      {SKILL_CATEGORY_ORDER.map((category) => (
        <section
          key={category}
          className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
          <div className='flex items-center gap-3'>
            <CategoryBadge category={category} size='sm' />
            <h3 className='text-base font-semibold text-zinc-100'>
              {t(`categories.${category}` as never)}
            </h3>
          </div>

          <div className='flex flex-wrap gap-2'>
            {guitarSkills
              .filter((skill) => skill.category === category)
              .map((skill) => {
                const isPicked = skill.id in value;
                return (
                  <button
                    key={skill.id}
                    type='button'
                    aria-pressed={isPicked}
                    onClick={() => onToggle(skill.id)}
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isPicked
                        ? "bg-zinc-100 text-zinc-950"
                        : "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800 hover:text-white",
                    )}>
                    {t(`skills.${skill.id}.name` as never)}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SessionSkillPicker;
