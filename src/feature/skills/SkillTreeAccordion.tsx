"use client";

import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SkillCategoryAccordion } from "feature/skills/components/SkillCategoryAccordion";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { Info, Gem, Diamond, Crown, Sparkles, X, Trophy, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface SkillTreeAccordionProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

const getCategoryConfig = (category: CategoryKeys) => {
  switch (category) {
    case "technique":
      return { 
        icon: Gem,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        glow: "shadow-red-500/10",
        from: "from-red-500/20",
        to: "to-red-900/20"
      };
    case "theory":
      return { 
        icon: Diamond,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        glow: "shadow-blue-500/10",
        from: "from-blue-500/20",
        to: "to-blue-900/20"
      };
    case "hearing":
      return { 
        icon: Crown,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "shadow-emerald-500/10",
        from: "from-emerald-500/20",
        to: "to-emerald-900/20"
      };
    case "creativity":
      return { 
        icon: Sparkles,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        glow: "shadow-purple-500/10",
        from: "from-purple-500/20",
        to: "to-purple-900/20"
      };
    default:
      return { 
        icon: Gem,
        color: "text-zinc-400",
        bg: "bg-zinc-500/10",
        border: "border-zinc-500/20",
        glow: "shadow-zinc-500/10",
        from: "from-zinc-500/20",
        to: "to-zinc-900/20"
      };
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
    <div className='font-openSans relative w-full overflow-hidden max-w-6xl mx-auto'>
      <div className='relative space-y-8 p-4 lg:p-8'>
        
        {/* Unified Dashboard Card */}
        <div className='relative rounded-3xl border border-zinc-800 bg-[#0d0d0c] overflow-hidden shadow-2xl'>
          {/* Background Ambient Effects */}
          <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none'></div>
          <div className='absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none'></div>

          <div className='relative p-8 md:p-10'>
            {/* Header / Intro */}
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12'>
              <div>
                <h2 className='text-3xl font-bold text-white mb-2 tracking-tight'>
                   Example Title
                </h2>
                <p className='text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed'>
                   {(t as any)("intro.description", "Master your craft by earning and allocating skill points. Focus on balanced growth to unlock advanced techniques.")}
                </p>
              </div>
              <div className='hidden md:block'>
                {/* Decorative Element */}
                <div className='flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500'>
                   <Info className='w-3 h-3' />
                   <span>Practice daily to earn points</span>
                </div>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
              {/* Total Points (Left) */}
              <div className='lg:col-span-4 relative group'>
                 <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                 <div className='relative h-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-center items-center text-center backdrop-blur-sm hover:border-zinc-700 transition-colors'>
                    <div className='relative mb-6'>
                       <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_40px_-5px_rgba(6,182,212,0.15)]'>
                          <Trophy className='w-10 h-10 text-cyan-400' />
                       </div>
                    </div>
                    <div>
                       <div className='text-5xl font-bold text-white mb-2 tracking-tighter'>{totalAvailablePoints}</div>
                       <div className='text-sm font-semibold text-cyan-500 uppercase tracking-widest'>Available Points</div>
                    </div>
                 </div>
              </div>

              {/* Categories Grid (Right) */}
              <div className='lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                 {Object.entries(userSkills.availablePoints).map(([category, points]) => {
                    const config = getCategoryConfig(category as CategoryKeys);
                    const isAvailable = points > 0;
                    
                    return (
                      <div 
                        key={category}
                        className={cn(
                          "group relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300",
                          isAvailable 
                            ? `border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50` 
                            : "border-zinc-800/50 bg-zinc-900/10 opacity-60"
                        )}
                      >
                        {/* Hover Gradient */}
                        <div className={cn(
                           "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                           config.from, config.to
                        )}></div>

                        <div className={cn(
                           "w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
                           isAvailable ? `${config.bg} ${config.border}` : "bg-zinc-800 border-zinc-700"
                        )}>
                           <config.icon className={cn("w-6 h-6", isAvailable ? config.color : "text-zinc-500")} />
                        </div>

                        <div>
                           <div className='text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1'>
                              {(t as any)(`categories.${category}`)}
                           </div>
                           <div className={cn("text-2xl font-bold", isAvailable ? "text-white" : "text-zinc-600")}>
                              {points} <span className='text-sm font-normal text-zinc-600 ml-1'>pts</span>
                           </div>
                        </div>

                        {isAvailable && (
                           <div className={cn("absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", config.color.replace('text-', 'bg-'))}></div>
                        )}
                      </div>
                    );
                 })}
              </div>
            </div>
          </div>
        </div>

        {/* Skill Trees Section */}
        <div className='mt-16'>
           <div className='flex items-center gap-3 mb-8 px-2'>
              <h3 className='text-xl font-bold text-white tracking-tight'>
                 {(t as any)("skill_trees", "Skill Progression")}
              </h3>
              <div className='h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent'></div>
           </div>

           <div className='space-y-6'>
             {Object.entries(categorizedSkills).map(([category, skills], index) => {
                return (
                   <motion.div
                     key={category}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.1 }}
                   >
                     <SkillCategoryAccordion
                       category={category as CategoryKeys}
                       skills={skills}
                       userSkills={userSkills}
                       onSkillUpgrade={onSkillUpgrade}
                     />
                   </motion.div>
                );
             })}
           </div>
        </div>

      </div>
    </div>
  );
};
