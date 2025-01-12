import { ScrollArea } from "assets/components/ui/scroll-area";
import { Badge } from "assets/components/ui/badge";
import { guitarSkills } from "src/data/guitarSkills";
import { GuitarSkill, UserSkills } from "types/skills.types";
import { Button } from "assets/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}
import { cn } from "assets/lib/utils";

export const SkillTree = ({ userSkills, onSkillUpgrade }: SkillTreeProps) => {
  const { t } = useTranslation();

  const canUpgradeSkill = (skill: GuitarSkill) => {
    const pointsCost = skill.pointsCost || 1;
    return userSkills.availablePoints[skill.category] >= pointsCost;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technique: "from-red-500/10 to-red-500/5 border-red-500/10",
      theory: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
      hearing: "from-green-500/10 to-green-500/5 border-green-500/10",
      creativity: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
    };
    return colors[category as keyof typeof colors] || "";
  };

  const categorizedSkills = guitarSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, GuitarSkill[]>);

  const getCategoryTotalLevel = (skills: GuitarSkill[]) => {
    return skills.reduce((total, skill) => {
      return total + (userSkills.unlockedSkills[skill.id] || 0);
    }, 0);
  };

  return (
    <div className='content-box relative h-[600px] w-full overflow-hidden font-openSans'>
      <div className="absolute inset-0 bg-[url('/skill-tree-bg.png')] opacity-5" />
      <ScrollArea className='h-full'>
        <div className='relative p-4'>
          <div className='mb-4 flex justify-center gap-4'>
            {Object.entries(userSkills.availablePoints).map(
              ([category, points]) => (
                <motion.div
                  key={category}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}>
                  <Badge
                    variant='outline'
                    className={cn(
                      "border-2 px-3 py-1",
                      getCategoryColor(category)
                    )}>
                    {points} {t(`skills:categories.${category}`)}
                  </Badge>
                </motion.div>
              )
            )}
          </div>

          <div className='grid grid-cols-2 gap-x-4 sm:grid-cols-4 sm:gap-x-8'>
            {Object.entries(categorizedSkills).map(([category, skills]) => (
              <div key={category} className='space-y-3'>
                <div className='text-center'>
                  <h2 className='text-lg font-bold capitalize'>
                    {t(`skills:categories.${category}`)}
                  </h2>
                  <motion.div
                    key={getCategoryTotalLevel(skills)}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}>
                    <Badge
                      variant='outline'
                      className={cn("px-2 py-0.5", getCategoryColor(category))}>
                      {t("skills:level")} {getCategoryTotalLevel(skills)}
                    </Badge>
                  </motion.div>
                </div>

                <div className='space-y-2'>
                  {skills.map((skill) => {
                    const currentLevel =
                      userSkills.unlockedSkills[skill.id] || 0;
                    const canUpgrade = canUpgradeSkill(skill);
                    const categoryColor = getCategoryColor(skill.category);

                    return (
                      <TooltipProvider key={skill.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "group relative rounded-md border p-2",
                                "bg-gradient-to-b",
                                categoryColor,
                                !canUpgrade && "opacity-40"
                              )}>
                              <div className='flex flex-col gap-2'>
                                <div className='flex items-center justify-between gap-2 text-white'>
                                  <div className='flex items-center gap-2'>
                                    {skill.icon && (
                                      <skill.icon className='h-4 w-4' />
                                    )}
                                    <div className='flex flex-col'>
                                      <span className='text-sm font-medium'>
                                        {t(`skills:skills.${skill.id}.name`)}
                                      </span>
                                      <div className='flex items-center gap-1'>
                                        <span className='text-xs text-gray-400'>
                                          {t("skills:level")} {currentLevel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {canUpgrade && (
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      onClick={() => {
                                        onSkillUpgrade(skill.id);
                                        // Add animation on click
                                        const button = document.getElementById(
                                          `button-${skill.id}`
                                        );
                                        if (button) {
                                          button.classList.add("animate-click");
                                          setTimeout(() => {
                                            button.classList.remove(
                                              "animate-click"
                                            );
                                          }, 300);
                                        }
                                      }}
                                      id={`button-${skill.id}`}
                                      className={cn(
                                        "h-5 w-5 p-0",
                                        "border-yellow-500/30 bg-yellow-500/5"
                                      )}>
                                      <Plus className='h-3 w-3' />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className='max-w-[200px] text-sm text-white'>
                              {t(`skills:skills.${skill.id}.description`)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
