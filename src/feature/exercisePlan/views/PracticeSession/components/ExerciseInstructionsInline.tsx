import { cn } from "assets/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaCheck, FaInfoCircle, FaLightbulb, FaSignal, FaGraduationCap } from "react-icons/fa";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import type { Exercise } from "../../../types/exercise.types";

interface ExerciseInstructionsInlineProps {
  exercise: Exercise;
  isPlaying: boolean;
  rewardSkillId?: string;
  rewardAmount?: number;
}

const skillLabel = (id?: string) => {
  switch (id) {
    case "technique": return "Technique";
    case "speed":     return "Speed";
    case "theory":    return "Theory";
    case "rhythm":    return "Rhythm";
    case "earTraining": return "Ear Training";
    case "knowledge": return "Knowledge";
    default: return id;
  }
};

export const ExerciseInstructionsInline = ({ 
  exercise, isPlaying, rewardSkillId, rewardAmount 
}: ExerciseInstructionsInlineProps) => {
  const { t } = useTranslation("skills");
  const [isExpanded, setIsExpanded] = useState(true);
  const hasInstructions = !!(exercise.instructions?.length || exercise.tips?.length);

  const displayAmount = rewardAmount || (
    exercise.difficulty === "easy" ? 1 :
    exercise.difficulty === "medium" ? 2 :
    exercise.difficulty === "hard" ? 3 : 0
  );

  const displaySkillId = rewardSkillId || (exercise.relatedSkills && exercise.relatedSkills[0]) || exercise.category;

  const getTranslatedSkill = (id?: string) => {
    if (!id) return "";
    if (["technique", "theory", "hearing", "creativity"].includes(id)) {
      const categoryTranslated = t(`categories.${id}`);
      if (categoryTranslated !== `categories.${id}`) return categoryTranslated;
    }
    const skillTranslated = t(`skills.${id}.name`);
    if (skillTranslated !== `skills.${id}.name`) return skillTranslated;
    return skillLabel(id);
  };

  useEffect(() => {
    if (isPlaying) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isPlaying]);

  if (!hasInstructions && !displayAmount) return null;

  return (
    <div className="w-full bg-zinc-950/40 border-t border-white/5 overflow-hidden text-left">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between group transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
            <FaInfoCircle size={14} className={cn(isExpanded ? "text-zinc-400" : "")} />
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors">Exercise Instructions</span>
          </div>
          
        </div>
        <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-6 md:p-8 pt-0 border-t border-white/[0.02]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                <div className="space-y-8">
                  {exercise.whyItMatters && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 text-zinc-400 mb-2">
                        <FaGraduationCap size={14} />
                        <h4 className="text-xs font-bold">Why This Matters</h4>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        {exercise.whyItMatters}
                      </p>
                    </div>
                  )}

                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 text-zinc-400 mb-2">
                        <FaInfoCircle size={14} />
                        <h4 className="text-xs font-bold">Instructions</h4>
                      </div>
                      <div className="space-y-3">
                        {exercise.instructions.map((instruction, idx) => (
                          <p key={idx} className="text-zinc-400 text-sm leading-relaxed font-medium">
                            {instruction}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {exercise.tips && exercise.tips.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-zinc-400 mb-2">
                      <FaLightbulb size={14} />
                      <h4 className="text-xs font-bold">Pro Tips</h4>
                    </div>
                    <div className="flex flex-col gap-3">
                      {exercise.tips.map((tip, idx) => (
                        <div key={idx} className="flex gap-3 text-zinc-400 text-sm leading-relaxed font-medium">
                          <span className="text-amber-500/50 font-bold shrink-0">#{idx + 1}</span>
                          <p>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {displayAmount > 0 && (
                  <div className="space-y-6">
                    {/* Difficulty Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-zinc-400">
                        <FaSignal size={14} className={cn(
                          exercise.difficulty === 'easy' ? 'text-emerald-500/80' : 
                          exercise.difficulty === 'medium' ? 'text-amber-500/80' : 'text-rose-500/80'
                        )} />
                        <h4 className="text-xs font-bold">Difficulty</h4>
                      </div>
                      <p className={cn(
                        "text-sm font-semibold capitalize pl-6",
                        exercise.difficulty === 'easy' ? 'text-emerald-400' : 
                        exercise.difficulty === 'medium' ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {exercise.difficulty}
                      </p>
                    </div>

                    {/* Potential Reward Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-zinc-400">
                        <span className="text-emerald-500/80 shrink-0">
                          {(() => {
                            const specificSkill = guitarSkills.find(s => s.id === displaySkillId);
                            if (specificSkill && specificSkill.icon) {
                              const SpecificIcon = specificSkill.icon;
                              return <SpecificIcon size={14} />;
                            }
                            const CategoryIcon = SKILL_CATEGORY_ICONS[displaySkillId as keyof typeof SKILL_CATEGORY_ICONS] || FaCheck;
                            return <CategoryIcon size={'small'} />;
                          })()}
                        </span>
                        <h4 className="text-xs font-bold">Potential Reward</h4>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed font-medium pl-6">
                        Earn <strong className="text-emerald-400">+{displayAmount}</strong> in <strong className="text-emerald-400">{getTranslatedSkill(displaySkillId as string)}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
