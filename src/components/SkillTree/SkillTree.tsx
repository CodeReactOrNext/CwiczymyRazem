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
import { motion, AnimatePresence } from "framer-motion";

interface SkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}
import { cn } from "assets/lib/utils";

export const SkillTree = ({ userSkills, onSkillUpgrade }: SkillTreeProps) => {
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
    <div className='content-box relative h-[600px] w-full overflow-hidden  font-openSans'>
      <div className="absolute inset-0 bg-[url('/skill-tree-bg.png')] opacity-5" />
      <ScrollArea className='h-full'>
        <div className='relative p-4'>
          <div className='absolute top-4 right-4 flex gap-2'>
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
                    {points} {category}
                  </Badge>
                </motion.div>
              )
            )}
          </div>

          <div className='grid grid-cols-4 gap-x-8'>
            {Object.entries(categorizedSkills).map(([category, skills]) => (
              <div key={category} className='space-y-3'>
                <div className='text-center'>
                  <h2 className='text-lg font-bold capitalize'>{category}</h2>
                  <motion.div
                    key={getCategoryTotalLevel(skills)}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}>
                    <Badge
                      variant='outline'
                      className={cn("px-2 py-0.5", getCategoryColor(category))}>
                      Level {getCategoryTotalLevel(skills)}
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
                            <motion.div
                              className={cn(
                                "group relative rounded-md border p-2",
                                "bg-gradient-to-b",
                                categoryColor,
                                !canUpgrade && "opacity-40"
                              )}
                              whileHover={{ scale: 1.02 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10,
                              }}>
                              <div className='flex flex-col gap-2'>
                                <div className='flex items-center justify-between gap-2 text-white'>
                                  <div className='flex items-center gap-2'>
                                    {skill.icon && (
                                      <skill.icon className='h-4 w-4' />
                                    )}
                                    <div className='flex flex-col'>
                                      <span className='text-sm font-medium'>
                                        {skill.name}
                                      </span>
                                      <div className='flex items-center gap-1'>
                                        <span className='text-xs text-gray-400'>
                                          Level {currentLevel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {canUpgrade && (
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      onClick={() => onSkillUpgrade(skill.id)}
                                      className={cn(
                                        "h-5 w-5 p-0",
                                        "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10"
                                      )}>
                                      <Plus className='h-3 w-3' />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className='max-w-[200px] text-sm text-white'>
                              {skill.description}
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
