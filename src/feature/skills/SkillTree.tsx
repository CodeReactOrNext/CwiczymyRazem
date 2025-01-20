import { Badge } from "assets/components/ui/badge";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { Button } from "assets/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { cn } from "assets/lib/utils";
import { SkillTreeCards } from "feature/skills/SkillTreeCards";

type SkillsNamespace = Record<string, Record<string, string>>;

interface SkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

const CATEGORY_COLORS = {
  technique: "from-red-500/10 to-red-500/5 border-red-500/10",
  theory: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
  hearing: "from-green-500/10 to-green-500/5 border-green-500/10",
  creativity: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
} as const;

const SkillCard = ({
  skill,
  currentLevel,
  canUpgrade,
  onUpgrade,
  t,
}: {
  skill: GuitarSkill;
  currentLevel: number;
  canUpgrade: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
}) => {
  const categoryColor =
    CATEGORY_COLORS[skill.category as keyof typeof CATEGORY_COLORS] || "";

  return (
    <TooltipProvider>
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
                  {skill.icon && <skill.icon className='h-4 w-4' />}
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>
                      {t(
                        `skills:skills.${skill.id}.name` as keyof SkillsNamespace
                      )}
                    </span>
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-gray-400'>
                        {t("skills:level")} {currentLevel}
                      </span>
                    </div>
                  </div>
                </div>
                {canUpgrade && (
                  <Button size='icon' className='h-7 w-7' onClick={onUpgrade}>
                    <Plus className='h-4 w-4' />
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
};

const CategorySection = ({
  skills,
  userSkills,
  onSkillUpgrade,
  t,
}: {
  skills: GuitarSkill[];
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
  t: (key: string) => string;
}) => {
  return (
    <div>
      <div className='space-y-2'>
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            currentLevel={userSkills.unlockedSkills[skill.id] || 0}
            canUpgrade={userSkills.availablePoints[skill.category] >= 1}
            onUpgrade={() => {
              onSkillUpgrade(skill.id);
              const button = document.getElementById(`button-${skill.id}`);
              if (button) {
                button.classList.add("animate-click");
                setTimeout(() => button.classList.remove("animate-click"), 300);
              }
            }}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

export const SkillTree = ({ userSkills, onSkillUpgrade }: SkillTreeProps) => {
  const { t } = useTranslation();

  const categorizedSkills = guitarSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, GuitarSkill[]>);

  return (
    <div className='content-box relative  w-full overflow-hidden font-openSans'>
      <div className='absolute inset-0' />

      <div className='relative p-4'>
        <SkillTreeCards userSkills={userSkills} />

        <div className='mb-6 flex flex-wrap gap-4'>
          {Object.entries(userSkills.availablePoints).some(
            ([_, points]) => points > 0
          ) && (
            <>
              <div className='text-lg font-semibold text-white'>
                Available Points:
              </div>
              {Object.entries(userSkills.availablePoints).map(
                ([category, points]) =>
                  points > 0 && (
                    <Badge>
                      {points} {t(`skills:categories.${category}` as any)}
                    </Badge>
                  )
              )}
            </>
          )}
        </div>

        <div className='grid grid-cols-1 gap-x-4 sm:gap-x-4 md:grid-cols-4'>
          {Object.entries(categorizedSkills).map(([category, skills]) => (
            <CategorySection
              key={category}
              skills={skills}
              userSkills={userSkills}
              onSkillUpgrade={onSkillUpgrade}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
