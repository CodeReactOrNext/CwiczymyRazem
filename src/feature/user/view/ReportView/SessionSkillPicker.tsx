import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { SKILL_CATEGORY_ORDER } from "feature/skills/utils/skillPointsByCategory";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { MAX_SKILL_MINUTES, type SkillMinutes } from "./helpers/sessionSkills";
import { MINUTE_STEP } from "./helpers/sessionSongs";

const stepUp = (minutes: number) =>
  Math.min(
    MAX_SKILL_MINUTES,
    (Math.floor(minutes / MINUTE_STEP) + 1) * MINUTE_STEP,
  );

const stepDown = (minutes: number) =>
  Math.max(0, (Math.ceil(minutes / MINUTE_STEP) - 1) * MINUTE_STEP);

const stepButtonClass =
  "flex h-10 w-10 items-center justify-center rounded bg-zinc-700/60 text-zinc-100 transition-colors hover:bg-zinc-600/70 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 disabled:pointer-events-none disabled:opacity-30 sm:h-9 sm:w-9";

const SkillMinutesRow = ({
  label,
  minutes,
  onChange,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}) => {
  // While the field is focused the raw text wins, so clearing it to type a new
  // number doesn't snap back to "0" under the cursor.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <li className='flex items-center gap-3'>
      <span className='min-w-0 flex-1 truncate text-sm font-medium text-zinc-100'>
        {label}
      </span>

      <div className='flex shrink-0 items-center gap-1'>
        <button
          type='button'
          aria-label={`Less ${label}`}
          disabled={minutes <= 0}
          onClick={() => onChange(stepDown(minutes))}
          className={stepButtonClass}>
          <Minus className='h-3.5 w-3.5' />
        </button>
        <div className='relative'>
          {/* text-base keeps iOS from zooming the page on focus. */}
          <input
            inputMode='numeric'
            aria-label={`Minutes of ${label}`}
            value={draft ?? String(minutes)}
            onChange={(event) => {
              const cleaned = event.target.value.replace(/\D/g, "").slice(0, 3);
              setDraft(cleaned);
              onChange(Math.min(Number(cleaned || 0), MAX_SKILL_MINUTES));
            }}
            onFocus={(event) => event.target.select()}
            onBlur={() => setDraft(null)}
            className='font-mono h-10 w-16 rounded bg-zinc-950/70 pr-5 text-right text-base font-bold text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 sm:h-9'
          />
          <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400'>
            m
          </span>
        </div>
        <button
          type='button'
          aria-label={`More ${label}`}
          onClick={() => onChange(stepUp(minutes))}
          className={stepButtonClass}>
          <Plus className='h-3.5 w-3.5' />
        </button>
      </div>
    </li>
  );
};

interface SessionSkillPickerProps {
  value: SkillMinutes;
  /** Picks a skill (at 0 min) or drops it. */
  onToggle: (skillId: string) => void;
  onSetMinutes: (skillId: string, minutes: number) => void;
}

/**
 * The by-skill half of a free log: tap the skills you worked on, then give
 * each its minutes. The minutes also fill the category boxes, so the session
 * scores exactly as if it had been logged by category.
 *
 * A picked skill's minutes sit right under its own category's chips — on a
 * phone the categories stack, and one shared list at the bottom would put the
 * row you just opened several screens away from the chip you tapped.
 */
const SessionSkillPicker = ({
  value,
  onToggle,
  onSetMinutes,
}: SessionSkillPickerProps) => {
  const { t } = useTranslation("skills");
  const skillName = (skillId: string) => t(`skills.${skillId}.name` as never);
  const hasPicked = Object.keys(value).length > 0;

  return (
    <div className='flex flex-col gap-4'>
      {!hasPicked && (
        <p className='text-sm text-zinc-400'>
          Tap the skills you worked on, then add their minutes. Tap a skill
          again to drop it.
        </p>
      )}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {SKILL_CATEGORY_ORDER.map((category) => {
          const CategoryIcon = SKILL_CATEGORY_ICONS[category];
          const skills = guitarSkills.filter(
            (skill) => skill.category === category,
          );
          // Catalogue order, so a row does not jump around as minutes change.
          const picked = skills.filter((skill) => skill.id in value);

          return (
            <section
              key={category}
              className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
              <div className='flex items-center gap-2'>
                <CategoryIcon className='h-4 w-4 text-zinc-400' />
                <h4 className='text-sm font-semibold text-zinc-200'>
                  {t(`categories.${category}` as never)}
                </h4>
              </div>

              <div className='flex flex-wrap gap-2'>
                {skills.map((skill) => {
                  const isPicked = skill.id in value;
                  return (
                    <button
                      key={skill.id}
                      type='button'
                      aria-pressed={isPicked}
                      onClick={() => onToggle(skill.id)}
                      className={cn(
                        "min-h-9 rounded px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 sm:min-h-0 sm:px-2.5 sm:py-1.5",
                        isPicked
                          ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-300"
                          : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 hover:text-white",
                      )}>
                      {skillName(skill.id)}
                    </button>
                  );
                })}
              </div>

              {picked.length > 0 && (
                <ul className='mt-1 flex flex-col gap-3'>
                  {picked.map((skill) => (
                    <SkillMinutesRow
                      key={skill.id}
                      label={skillName(skill.id)}
                      minutes={value[skill.id] ?? 0}
                      onChange={(minutes) => onSetMinutes(skill.id, minutes)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default SessionSkillPicker;
