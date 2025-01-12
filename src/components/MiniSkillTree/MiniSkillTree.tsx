import { Badge } from "assets/components/ui/badge";
import { guitarSkills } from "src/data/guitarSkills";
import { GuitarSkill, UserSkills } from "types/skills.types";
import { Button } from "assets/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface MiniSkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
  highlightCategories?: string[];
}

export const MiniSkillTree = ({
  userSkills,
  onSkillUpgrade,
  highlightCategories = [],
}: MiniSkillTreeProps) => {
  const { t } = useTranslation();

  const getCategoryColor = (category: string) => {
    const colors = {
      technique: "from-red-500/10 to-red-500/5 border-red-500/10",
      theory: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
      hearing: "from-green-500/10 to-green-500/5 border-green-500/10",
      creativity: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
    };
    return colors[category as keyof typeof colors] || "";
  };

  const relevantSkills = guitarSkills.filter(
    (skill) =>
      highlightCategories.includes(skill.category) &&
      userSkills?.availablePoints?.[skill.category] > 0
  );

  if (relevantSkills.length === 0) return null;

  return (
    <div className='rounded-lg bg-second-500 p-4 font-openSans'>
      <div className='mb-4 flex gap-2'>
        {userSkills?.availablePoints &&
          Object.entries(userSkills.availablePoints)
            .filter(([category]) => highlightCategories.includes(category))
            .map(([category, points]) => (
              <Badge
                key={category}
                variant='outline'
                className={cn(
                  "border-2 px-3 py-1",
                  getCategoryColor(category)
                )}>
                {points} {t(`skills:categories.${category}`)}
              </Badge>
            ))}
      </div>

      <div className='grid grid-cols-2 gap-2 font-openSans md:grid-cols-3 '>
        {relevantSkills.map((skill) => (
          <motion.div
            key={skill.id}
            className={cn(
              "relative rounded-md border p-2",
              "bg-gradient-to-b",
              getCategoryColor(skill.category)
            )}
            whileHover={{ scale: 1.02 }}>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                {skill.icon && <skill.icon className='h-4 w-4' />}
                <span className='text-sm'>
                  {t(`skills:skills.${skill.id}.name`)}
                </span>
              </div>
              <Button
                size='sm'
                variant='outline'
                onClick={() => onSkillUpgrade(skill.id)}
                className='h-5 w-5 border-yellow-500/30 bg-yellow-500/5 p-0 hover:bg-yellow-500/10'>
                <Plus className='h-3 w-3' />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
