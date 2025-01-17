import { Badge } from "assets/components/ui/badge";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { Button } from "assets/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useState } from "react";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { updateUserSkills } from "feature/skills/services/updateUserSkills";

interface MiniSkillTreeProps {
  highlightCategories?: string[];
}

export const MiniSkillTree = ({
  highlightCategories = [],
}: MiniSkillTreeProps) => {
  const { t } = useTranslation(["skills", "common", "report"]);
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
    const pointsCost = 1;
    if (!userSkills) return false;
    return userSkills.availablePoints[skill.category] >= pointsCost;
  };

  const handleSkillUpgrade = async (skillId: string) => {
    if (!userSkills || !userAuth) return;

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) return;

    if (!canUpgradeSkill(skill)) {
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
    <>
      {userSkills?.availablePoints && (
        <div className='my-6 rounded-lg bg-second-500 p-4 font-openSans'>
          <h3 className='mb-4 text-lg font-semibold'>
            {t("report:rating_popup.skill_points_gained")}
          </h3>
          <div className='flex gap-8'>
            {Object.entries(userSkills?.availablePoints).map(
              ([skill, points]) =>
                points > 0 && (
                  <div key={skill}>
                    <Badge
                      variant='outline'
                      className={`
                        px-3 py-1 text-sm
                        ${
                          skill === "technique" &&
                          "border-red-500/30 bg-red-500/5"
                        }
                        ${
                          skill === "theory" &&
                          "border-blue-500/30 bg-blue-500/5"
                        }
                        ${
                          skill === "hearing" &&
                          "border-green-500/30 bg-green-500/5"
                        }
                        ${
                          skill === "creativity" &&
                          "border-purple-500/30 bg-purple-500/5"
                        }
                      `}>
                      +{points} {t(`report:skills.${skill}` as any)}
                    </Badge>
                  </div>
                )
            )}
          </div>
        </div>
      )}
      <div className='mb-4 rounded-lg bg-second-500 p-4 font-openSans'>
        <div className='grid grid-cols-1 gap-3 font-openSans md:grid-cols-2'>
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
                  isHighlighted && "ring-2 ring-white"
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
                      className='h-7 w-7'>
                      <Plus className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
};
