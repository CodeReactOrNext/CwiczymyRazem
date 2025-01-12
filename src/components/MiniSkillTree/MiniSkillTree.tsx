import { Badge } from "assets/components/ui/badge";
import { guitarSkills } from "src/data/guitarSkills";
import { GuitarSkill, UserSkills } from "types/skills.types";
import { Button } from "assets/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useState } from "react";
import {
  getUserSkills,
  getUserSongs,
  updateUserSkills,
} from "utils/firebase/client/firebase.utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

type CategoryKey = "technique" | "theory" | "hearing" | "creativity";

interface MiniSkillTreeProps {
  highlightCategories?: string[];
}

type SkillKey = keyof typeof guitarSkills[number]["id"];

export const MiniSkillTree = ({
  highlightCategories = [],
}: MiniSkillTreeProps) => {
  const { t } = useTranslation(["skills", "common"]);
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkillsLocal] = useState<UserSkills>();
  const [highlightedSkills, setHighlightedSkills] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!userAuth) return;
    getUserSkills(userAuth).then((skills) => setUserSkillsLocal(skills));
  }, []);

  const getCategoryColor = (category: string) => {
    const colors = {
      technique: "from-red-500/10 to-red-500/5 border-red-500/10",
      theory: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
      hearing: "from-green-500/10 to-green-500/5 border-green-500/10",
      creativity: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
    };
    return colors[category as keyof typeof colors] || "";
  };

  const canUpgradeSkill = (skill: GuitarSkill) => {
    const pointsCost = skill.pointsCost || 1;
    if (!userSkills) return false;
    return userSkills.availablePoints[skill.category] >= pointsCost;
  };

  const getCategoryTotalLevel = (skills: GuitarSkill[]) => {
    return skills.reduce((total, skill) => {
      return total + (userSkills?.unlockedSkills[skill.id] || 0);
    }, 0);
  };

  const handleSkillUpgrade = async (skillId: string) => {
    if (!userSkills || !userAuth) return;

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) return;

    if (!canUpgradeSkill(skill)) {
      console.log("Cannot upgrade skill");
      return;
    }

    const success = await updateUserSkills(userAuth, skillId);

    if (success) {
      const updatedSkills = await getUserSkills(userAuth);
      setUserSkillsLocal(updatedSkills);
      setHighlightedSkills((prev) => new Set(prev).add(skillId));
    } else {
      console.error("Failed to upgrade skill");
    }
  };

  const relevantSkills = guitarSkills.filter(
    (skill) =>
      highlightCategories.includes(skill.category) ||
      highlightedSkills.has(skill.id)
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
                {points}{" "}
                {t(`skills:categories.${category as CategoryKey}`) as string}
                <span className='ml-2'>
                  {t("skills:level") as string}
                  {getCategoryTotalLevel(
                    guitarSkills.filter((skill) => skill.category === category)
                  )}
                </span>
              </Badge>
            ))}
      </div>

      <div className='grid grid-cols-2 gap-2 font-openSans md:grid-cols-3'>
        {relevantSkills.map((skill) => {
          const currentLevel = userSkills?.unlockedSkills?.[skill.id] || 0;
          const canUpgrade = canUpgradeSkill(skill);
          const isHighlighted = highlightedSkills.has(skill.id);

          return (
            <motion.div
              key={skill.id}
              className={cn(
                "relative rounded-md border p-2",
                "bg-gradient-to-b",
                getCategoryColor(skill.category),
                !canUpgrade && "opacity-40",
                isHighlighted && "ring-2 ring-yellow-500"
              )}
              whileHover={{ scale: 1.02 }}>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    {skill.icon && <skill.icon className='h-4 w-4' />}
                    <span className='text-sm'>
                      {t(`skills:skills.${skill.id}.name` as any)}
                    </span>
                  </div>
                  <span className='text-xs text-gray-400'>
                    {t("skills:level")} {currentLevel}
                  </span>
                </div>
                {canUpgrade && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      handleSkillUpgrade(skill.id);
                      const button = document.getElementById(
                        `button-${skill.id}`
                      );
                      if (button) {
                        button.classList.add("animate-click");
                        setTimeout(() => {
                          button.classList.remove("animate-click");
                        }, 300);
                      }
                    }}
                    id={`button-${skill.id}`}
                    className='h-5 w-5 border-yellow-500/30 bg-yellow-500/5 p-0 hover:bg-yellow-500/10'>
                    <Plus className='h-3 w-3' />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
