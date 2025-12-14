import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { SkillCard } from "feature/skills/SkillCard";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { SkillTreeCards } from "feature/skills/SkillTreeCards";
import { Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";

interface SkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

const canUpgradeSkill = (
  skill: GuitarSkill,
  userSkills: UserSkills
): boolean => {
  const hasPoints =
    userSkills.availablePoints[
      skill.category as keyof typeof userSkills.availablePoints
    ] > 0;

  return hasPoints;
};

const CategorySection = ({
  category,
  skills,
  userSkills,
  onSkillUpgrade,
}: {
  category: CategoryKeys;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}) => {
  const { t } = useTranslation("skills");

  const filteredSkills = skills.filter(
    (skill) => (userSkills.unlockedSkills[skill.id] || 0) > 0
  );

  if (filteredSkills.length === 0) {
    return (
      <div className='space-y-1 rounded-md border border-second-400/10 bg-second-500/10 p-2'>
     
      </div>
    );
  }

  return (
    <div className='space-y-1 rounded-md border border-second-400/10 bg-second-500/10 p-2'>
      {skills.map((skill) => {
        const canUpgrade = canUpgradeSkill(skill, userSkills);

        return (
          <SkillCard
            key={skill.id}
            skill={skill}
            userSkills={userSkills}
            canUpgrade={canUpgrade}
            onUpgrade={() => onSkillUpgrade(skill.id)}
          />
        );
      })}
    </div>
  );
};

export const SkillTree = ({ userSkills, onSkillUpgrade }: SkillTreeProps) => {
  const { t } = useTranslation("skills");
  const [showIntro, setShowIntro] = useState(true);

  const categorizedSkills = guitarSkills.reduce((acc, skill) => {
    const category = skill.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<CategoryKeys, GuitarSkill[]>);

  const totalAvailablePoints = Object.values(userSkills.availablePoints).reduce(
    (sum, points) => sum + points,
    0
  );

  return (
    <div className='content-box font-openSans relative w-full overflow-hidden'>
      <div className='absolute inset-0' />

      <div className='relative p-4'>
        {showIntro && (
          <div className='mb-6 rounded-lg border border-second-400/20 bg-second-400/10 p-4'>
            <div className='flex items-start gap-3'>
              <Info className='text-primary-400 mt-0.5 h-5 w-5 flex-shrink-0' />
              <div>
                <h3 className='mb-1 text-base font-medium text-white'>
                  {t("intro.title")}
                </h3>
                <p className='mb-2 text-sm text-gray-300'>
                  {t("intro.description")}
                </p>
                <ul className='ml-1 list-inside list-disc space-y-1 text-xs text-gray-400'>
                  <li>{t("intro.point1")}</li>
                  <li>{t("intro.point2")}</li>
                  <li>{t("intro.point3")}</li>
                </ul>
                <div className='mt-3 flex justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowIntro(false)}
                    className='text-xs'>
                    {t("intro.got_it")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SkillTreeCards
          isUserProfile={false}
          userSkills={userSkills}
          onSkillUpgrade={onSkillUpgrade}
        />

        {totalAvailablePoints > 0 && (
          <div className='mb-6 flex flex-col gap-2 rounded-md border border-second-400/20 bg-second-400/10 p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-base font-semibold text-white'>
                {t("skills:available_points" as any)}:
                <Badge
                  className={cn(
                    "ml-2 border border-emerald-500/30 bg-emerald-900/40 text-emerald-200",
                    "flex items-center gap-1 px-1.5 py-0.5 shadow-sm"
                  )}>
                  <FaPlus className='h-2.5 w-2.5 opacity-80' />
                  <span className='text-xs font-medium'>
                    {totalAvailablePoints}
                  </span>
                </Badge>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(userSkills.availablePoints).map(
                ([category, points], index) =>
                  points > 0 && (
                    <Badge
                      key={index}
                      className={cn(
                        "bg-second-500/50 px-2 py-1 text-sm",
                        category === "technique" &&
                          "border border-red-500/50 bg-red-500/10 text-red-300",
                        category === "theory" &&
                          "border border-blue-500/50 bg-blue-500/10 text-blue-300",
                        category === "hearing" &&
                          "border border-green-500/50 bg-green-500/10 text-green-300",
                        category === "creativity" &&
                          "border border-purple-500/50 bg-purple-500/10 text-purple-300"
                      )}>
                      {points} {t(`skills:categories.${category}` as any)}
                    </Badge>
                  )
              )}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4'>
          {Object.entries(categorizedSkills).map(([category, skills]) => (
            <div key={category} className='space-y-2'>
              <h3
                className={cn(
                  "flex items-center rounded px-2 py-1 text-sm font-medium",
                  category === "technique" && "bg-red-500/10 text-red-400",
                  category === "theory" && "bg-blue-500/10 text-blue-400",
                  category === "hearing" && "bg-green-500/10 text-green-400",
                  category === "creativity" &&
                    "bg-purple-500/10 text-purple-400"
                )}>
                {t(`skills:categories.${category}` as any)}
                {userSkills.availablePoints[category as CategoryKeys] > 0 && (
                  <Badge
                    className={cn(
                      "ml-2 border",
                      category === "technique" &&
                        "border-red-500/30 bg-red-900/40 text-red-200",
                      category === "theory" &&
                        "border-blue-500/30 bg-blue-900/40 text-blue-200",
                      category === "hearing" &&
                        "border-green-500/30 bg-green-900/40 text-green-200",
                      category === "creativity" &&
                        "border-purple-500/30 bg-purple-900/40 text-purple-200",
                      "flex items-center gap-1 px-1.5 py-0.5 shadow-sm"
                    )}>
                    <FaPlus className='h-2.5 w-2.5 opacity-80' />
                    <span className='text-xs font-medium'>
                      {userSkills.availablePoints[category as CategoryKeys]}
                    </span>
                  </Badge>
                )}
              </h3>
              <CategorySection
                category={category as CategoryKeys}
                skills={skills}
                userSkills={userSkills}
                onSkillUpgrade={onSkillUpgrade}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
