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
    <div className='font-openSans relative w-full overflow-hidden'>
      <div className='relative space-y-8 p-6'>
        {/* Intro Card */}
        {showIntro && (
          <div className='rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-start gap-3'>
              <Info className='mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400' />
              <div className='flex-1'>
                <h3 className='mb-2 text-lg font-semibold text-slate-100'>
                  {t("intro.title")}
                </h3>
                <p className='mb-3 text-sm text-slate-300'>
                  {t("intro.description")}
                </p>
                <ul className='ml-1 list-inside list-disc space-y-1 text-sm text-slate-400'>
                  <li>{t("intro.point1")}</li>
                  <li>{t("intro.point2")}</li>
                  <li>{t("intro.point3")}</li>
                </ul>
                <div className='mt-4 flex justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowIntro(false)}
                    className='text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'>
                    {t("intro.got_it")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Points Summary - Enhanced */}
        {totalAvailablePoints > 0 && (
          <div className='relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur-sm'>
            {/* Subtle accent glow */}
            <div className='to-emerald-600/3 absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent' />

            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative rounded-xl border border-emerald-600/30 bg-slate-800/60 p-3 shadow-lg ring-1 ring-emerald-500/20'>
                    <Sparkles className='h-6 w-6 text-emerald-300' />
                    {/* Icon glow */}
                    <div className='absolute inset-0 animate-pulse rounded-xl bg-emerald-500/10 blur-sm' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-slate-100'>
                      {t("available_points")}
                    </h3>
                    <p className='text-sm text-slate-300'>
                      {t("point_usage_hint")}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Badge className='border-emerald-500/50 bg-slate-800/60 px-4 py-2 text-emerald-300 shadow-lg ring-1 ring-emerald-500/30'>
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
                            "border-red-500/50 bg-slate-800/60 text-red-300 ring-1 ring-red-500/20",
                          category === "theory" &&
                            "border-blue-500/50 bg-slate-800/60 text-blue-300 ring-1 ring-blue-500/20",
                          category === "hearing" &&
                            "border-emerald-500/50 bg-slate-800/60 text-emerald-300 ring-1 ring-emerald-500/20",
                          category === "creativity" &&
                            "border-purple-500/50 bg-slate-800/60 text-purple-300 ring-1 ring-purple-500/20"
                        )}>
                        <div className='animate-pulse'>
                          {getCurrencyIcon(category as CategoryKeys)}
                        </div>
                        <span className='font-bold'>{points}</span>
                        <span className='opacity-90'>
                          {t(`categories.${category}`)}
                        </span>
                        {/* Subtle glow */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full opacity-10 blur-sm",
                            category === "technique" && "bg-red-500/30",
                            category === "theory" && "bg-blue-500/30",
                            category === "hearing" && "bg-emerald-500/30",
                            category === "creativity" && "bg-purple-500/30"
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
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold text-slate-100'>
            {t("skill_categories")}
          </h2>
          <div className='space-y-4'>
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
