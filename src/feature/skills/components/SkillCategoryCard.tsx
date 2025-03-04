import { cn } from "assets/lib/utils";
import { SkillCategoryBadge } from "feature/skills/components/SkillCategoryBadge";
import { SkillCategoryTitle } from "feature/skills/components/SkillCategoryTitle";
import { SkillsList } from "feature/skills/components/SkillsList";
import { SKILL_CATEGORY_COLORS } from "feature/skills/constants/skillColors";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SkillCategoryCardProps {
  category: string;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  index: number;
}

export const SkillCategoryCard = ({
  category,
  skills,
  userSkills,
  index,
}: SkillCategoryCardProps) => {
  const { t } = useTranslation();
  const CategoryIcon =
    SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS];
  const totalPoints = skills.reduce(
    (sum, skill) => sum + (userSkills.unlockedSkills[skill.id] || 0),
    0
  );
  const categoryLevel = Math.floor(totalPoints / 10);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative mt-5 rounded-md border p-4 pt-12",
        "bg-gradient-to-br backdrop-blur-sm transition-all duration-300 hover:bg-black/30",
        SKILL_CATEGORY_COLORS[category as keyof typeof SKILL_CATEGORY_COLORS]
      )}>
      <SkillCategoryBadge
        category={category}
        icon={CategoryIcon}
        level={categoryLevel}
      />
      <SkillCategoryTitle
        category={category}
        title={t(`skills:categories.${category}` as any)}
      />
      <SkillsList skills={skills} userSkills={userSkills} category={category} />
    </motion.div>
  );
};
