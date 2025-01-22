import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { useTranslation } from "react-i18next";

interface SkillTreeProps {
  userSkills: UserSkills;
}

const CATEGORY_COLORS = {
  technique: "from-red-500/10 to-red-500/5 border-red-500/10",
  theory: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
  hearing: "from-green-500/10 to-green-500/5 border-green-500/10",
  creativity: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
} as const;

export const SkillTreeCards = ({ userSkills }: SkillTreeProps) => {
  const { t } = useTranslation();

  const categorizedSkills = guitarSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, GuitarSkill[]>);

  return (
    <div className='mb-12 font-openSans '>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-4'>
        {Object.entries(categorizedSkills).map(([category, skills]) => (
          <div
            key={category}
            className={cn(
              "rounded-md border p-4",
              "bg-gradient-to-b",
              CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
            )}>
            <h3 className='mb-4 font-semibold capitalize text-white'>
              {t(`skills:categories.${category}` as any)}
            </h3>
            {skills.map((skill) => (
              <div
                key={skill.id}
                className='mb-1 flex items-center justify-between gap-3 text-sm '>
                <span>{t(`skills:skills.${skill.id}.name` as any)}</span>
                <span className='font-semibold '>
                  {userSkills.unlockedSkills[skill.id] || 0}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
