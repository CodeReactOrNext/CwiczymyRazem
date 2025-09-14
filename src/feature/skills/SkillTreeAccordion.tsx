import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SkillCategoryAccordion } from "feature/skills/components/SkillCategoryAccordion";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { Info, Gem, Diamond, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SkillTreeAccordionProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

// RPG-style currency icons for each category
const getCurrencyIcon = (category: CategoryKeys) => {
  switch (category) {
    case "technique":
      return <Gem className='h-4 w-4 text-red-400' />; // Ruby for technique
    case "theory":
      return <Diamond className='h-4 w-4 text-blue-400' />; // Crystal for theory
    case "hearing":
      return <Crown className='h-4 w-4 text-emerald-400' />; // Pearl for hearing
    case "creativity":
      return <Sparkles className='h-4 w-4 text-purple-400' />; // Star for creativity
    default:
      return <Gem className='h-4 w-4 text-zinc-400' />;
  }
};

export const SkillTreeAccordion = ({
  userSkills,
  onSkillUpgrade,
}: SkillTreeAccordionProps) => {
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
      <div className='relative space-y-6 p-4'>
        {/* Intro Card */}
        {showIntro && (
          <div className='rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-4 backdrop-blur-sm'>
            <div className='flex items-start gap-3'>
              <Info className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400' />
              <div className='flex-1'>
                <h3 className='mb-1 text-base font-medium text-white'>
                  {t("intro.title")}
                </h3>
                <p className='mb-2 text-sm text-zinc-300'>
                  {t("intro.description")}
                </p>
                <ul className='ml-1 list-inside list-disc space-y-1 text-xs text-zinc-400'>
                  <li>{t("intro.point1")}</li>
                  <li>{t("intro.point2")}</li>
                  <li>{t("intro.point3")}</li>
                </ul>
                <div className='mt-3 flex justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowIntro(false)}
                    className='text-xs hover:bg-white/10'>
                    {t("intro.got_it")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Points Summary - Enhanced */}
        {totalAvailablePoints > 0 && (
          <div className='relative overflow-hidden rounded-xl border border-emerald-700/30 bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 p-5 shadow-xl backdrop-blur-sm'>
            {/* Background glow */}
            <div className='absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-600/5' />

            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative rounded-xl bg-emerald-900/60 p-3 shadow-lg ring-1 ring-emerald-500/20'>
                    <Sparkles className='h-6 w-6 text-emerald-300' />
                    {/* Icon glow */}
                    <div className='absolute inset-0 animate-pulse rounded-xl bg-emerald-500/20 blur-sm' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-emerald-300'>
                      {t("available_points")}
                    </h3>
                    <p className='text-sm text-emerald-400/80'>
                      {t("point_usage_hint")}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Badge className='border-emerald-600/50 bg-emerald-900/60 px-4 py-2 text-emerald-200 shadow-lg ring-1 ring-emerald-500/20'>
                    <Sparkles className='mr-2 h-4 w-4 animate-pulse' />
                    <span className='text-lg font-bold'>
                      {totalAvailablePoints}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Currency Breakdown - Enhanced */}
              <div className='mt-4 flex flex-wrap gap-3'>
                {Object.entries(userSkills.availablePoints).map(
                  ([category, points]) =>
                    points > 0 && (
                      <div
                        key={category}
                        className={cn(
                          "relative flex items-center gap-2 rounded-full border-2 px-3 py-2 text-sm font-semibold shadow-md transition-all duration-300 hover:scale-105",
                          category === "technique" &&
                            "border-red-600/50 bg-red-900/40 text-red-200 ring-1 ring-red-500/20",
                          category === "theory" &&
                            "border-blue-600/50 bg-blue-900/40 text-blue-200 ring-1 ring-blue-500/20",
                          category === "hearing" &&
                            "border-emerald-600/50 bg-emerald-900/40 text-emerald-200 ring-1 ring-emerald-500/20",
                          category === "creativity" &&
                            "border-purple-600/50 bg-purple-900/40 text-purple-200 ring-1 ring-purple-500/20"
                        )}>
                        <div className='animate-pulse'>
                          {getCurrencyIcon(category as CategoryKeys)}
                        </div>
                        <span className='font-bold'>{points}</span>
                        <span className='opacity-90'>
                          {t(`categories.${category}`)}
                        </span>
                        {/* Currency glow */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full opacity-30 blur-sm",
                            category === "technique" && "bg-red-500/20",
                            category === "theory" && "bg-blue-500/20",
                            category === "hearing" && "bg-emerald-500/20",
                            category === "creativity" && "bg-purple-500/20"
                          )}
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skill Categories Accordion */}
        <div className='space-y-3'>
          <h2 className='text-lg font-semibold text-white'>
            {t("skill_categories")}
          </h2>
          <div className='space-y-3'>
            {Object.entries(categorizedSkills).map(([category, skills]) => (
              <SkillCategoryAccordion
                key={category}
                category={category as CategoryKeys}
                skills={skills}
                userSkills={userSkills}
                onSkillUpgrade={onSkillUpgrade}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
