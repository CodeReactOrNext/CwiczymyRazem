import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { PLAYABLE_SKILLS } from "feature/rotation/data/rotationCatalog";
import { useRotationDisplay } from "feature/rotation/hooks/useRotationDisplay";
import { Check } from "lucide-react";

import { useCalendarDisplay } from "../../hooks/useCalendarDisplay";
import type { PracticeArea } from "../../types/calendar.types";
import { AREA_DOT } from "../../utils/areaStyles";

const SKILL_AREAS: Exclude<PracticeArea, "songs">[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];

/** How many drills in the catalog train each skill. */
const DRILLS_PER_SKILL = new Map(
  PLAYABLE_SKILLS.map((skill) => [
    skill.id,
    exercisesAgregat.filter(
      (exercise) =>
        !exercise.songData && exercise.relatedSkills.includes(skill.id),
    ).length,
  ]),
);

interface SkillPickerProps {
  value: string[];
  onChange: (skills: string[]) => void;
}

/**
 * Narrows the planned drills to the skills the player wants to work on,
 * grouped by area. Nothing picked means any skill.
 */
export const SkillPicker = ({ value, onChange }: SkillPickerProps) => {
  const { skillName } = useRotationDisplay();
  const { t } = useCalendarDisplay();

  const toggle = (skillId: string) =>
    onChange(
      value.includes(skillId)
        ? value.filter((id) => id !== skillId)
        : [...value, skillId],
    );

  return (
    <div className='space-y-7'>
      {SKILL_AREAS.map((area) => {
        const skills = PLAYABLE_SKILLS.filter(
          (skill) => skill.category === area,
        );
        if (skills.length === 0) return null;
        return (
          <div key={area} className='space-y-3'>
            <p className='flex items-center gap-2 text-xs text-zinc-400'>
              <span
                className={cn("h-1.5 w-1.5 rounded-full", AREA_DOT[area])}
              />
              {t(`areas.${area}`)}
            </p>
            <div className='flex flex-wrap gap-2'>
              {skills.map((skill) => {
                const active = value.includes(skill.id);
                const Icon = skill.icon;
                return (
                  <button
                    key={skill.id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => toggle(skill.id)}
                    className={cn(
                      "flex h-10 items-center gap-2.5 rounded-lg pl-3 pr-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                      active
                        ? "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                        : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
                    )}>
                    {active ? (
                      <Check className='h-4 w-4 text-emerald-400' aria-hidden />
                    ) : Icon ? (
                      <Icon
                        size='1.1em'
                        className='text-zinc-400'
                        aria-hidden
                      />
                    ) : null}
                    {skillName(skill.id)}
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        active ? "text-zinc-400" : "text-zinc-500",
                      )}>
                      {DRILLS_PER_SKILL.get(skill.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
