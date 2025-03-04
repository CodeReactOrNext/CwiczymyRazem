import { SkillCategoryCard } from "feature/skills/components/SkillCategoryCard";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SkillTreeProps {
  userSkills: UserSkills;
}

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
    <div className='mb-12 font-openSans'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='grid grid-cols-1 gap-6 sm:grid-cols-4'>
        {Object.entries(categorizedSkills).map(([category, skills], index) => (
          <SkillCategoryCard
            key={category}
            category={category}
            skills={skills}
            userSkills={userSkills}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
};
