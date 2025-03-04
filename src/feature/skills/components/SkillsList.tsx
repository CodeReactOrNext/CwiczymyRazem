import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_TEXT_COLORS } from "feature/skills/constants/skillColors";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";

interface SkillsListProps {
  skills: GuitarSkill[];
  userSkills: UserSkills;
  category: string;
}

export const SkillsList = ({
  skills,
  userSkills,
  category,
}: SkillsListProps) => {
  const { t } = useTranslation();

  return (
    <div className='space-y-2'>
      {skills.map((skill) => {
        const level = userSkills.unlockedSkills[skill.id] || 0;
        const isMaxed = level >= 10;

        return (
          <motion.div
            key={skill.id}
            whileHover={{ x: 5 }}
            className='flex items-center justify-between gap-3 rounded-md p-2 text-sm text-gray-300 transition-colors hover:bg-black/30'>
            <span className='font-medium tracking-wide'>
              {t(`skills:skills.${skill.id}.name` as any)}
            </span>
            <div className='flex items-center'>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-bold",
                  SKILL_CATEGORY_TEXT_COLORS[
                    category as keyof typeof SKILL_CATEGORY_TEXT_COLORS
                  ]
                )}>
                {isMaxed && <FaStar className='h-3 w-3 text-yellow-400' />}
                {level}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
