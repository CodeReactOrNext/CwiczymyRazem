import { cn } from "assets/lib/utils";
import { FaCheck, FaInfoCircle, FaLightbulb, FaSignal, FaGraduationCap, FaHeart, FaExternalLinkAlt, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
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
  exercise, rewardSkillId, rewardAmount
}: ExerciseInstructionsInlineProps) => {
  const { t } = useTranslation("skills");
  const hasInstructions = !!(exercise.instructions?.length || exercise.tips?.length);
  const hasLinks = !!(exercise.links && exercise.links.length > 0);
  const isPlayalong = !!exercise.isPlayalong;

  const displayAmount = rewardAmount || (
    exercise.difficulty === "easy" ? 1 :
    exercise.difficulty === "medium" ? 2 :
    exercise.difficulty === "hard" ? 3 : 0
  );

  const displaySkillIds = rewardSkillId 
    ? [rewardSkillId] 
    : (exercise.relatedSkills && exercise.relatedSkills.length > 0)
      ? exercise.relatedSkills 
      : [exercise.category];

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

  if (!hasInstructions && !displayAmount && !hasLinks) return null;

  const supportAuthorBlock = hasLinks ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 text-red-400">
        <FaHeart size={14} className="animate-pulse" />
        <h4 className="text-xs font-bold">Support Author</h4>
      </div>
      <div className="flex flex-col gap-2">
        {exercise.links!.map((link, idx) => {
          let Icon = FaExternalLinkAlt;
          if (link.url.includes("facebook"))                              Icon = FaFacebook;
          if (link.url.includes("instagram"))                             Icon = FaInstagram;
          if (link.url.includes("twitter") || link.url.includes("x.com")) Icon = FaTwitter;
          if (link.url.includes("patreon"))                               Icon = FaHeart;
          return (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
            >
              <div className="flex items-center gap-3">
                <Icon className={cn(
                  "h-4 w-4",
                  link.url.includes("patreon") ? "text-red-500" : "text-zinc-400 group-hover:text-white"
                )} />
                <span className="text-zinc-300 group-hover:text-white font-medium">{link.label}</span>
              </div>
              <FaExternalLinkAlt className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
            </a>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full overflow-hidden text-left">
      <div className="w-full px-6 py-3 flex items-center">
        <div className="flex items-center gap-2.5 text-zinc-400">
          <FaInfoCircle size={14} className="text-zinc-400" />
          <span className="text-xs font-bold text-zinc-400">Exercise Instructions</span>
        </div>
      </div>

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

                {isPlayalong ? (
                  hasLinks && <div className="space-y-6">{supportAuthorBlock}</div>
                ) : (exercise.requiresBackingTrack || (exercise.tips && exercise.tips.length > 0)) && (
                  <div className="space-y-6">
                    {exercise.requiresBackingTrack && (
                      <div className="p-3.5 bg-amber-500/10 rounded-lg flex items-start gap-3 text-amber-400 text-sm leading-relaxed font-semibold">
                        <FaInfoCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                        <div>
                          <div className="text-[11px] font-bold text-amber-500/80 mb-1">Backing track recommended</div>
                          Use the backing track finder above to play along.
                        </div>
                      </div>
                    )}

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
                  </div>
                )}

                {(displayAmount > 0 || (hasLinks && !isPlayalong)) && (
                  <div className="space-y-6">
                    {displayAmount > 0 && (
                    <>
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

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-zinc-400">
                        <FaCheck size={14} className="text-emerald-500/80" />
                        <h4 className="text-xs font-bold">Potential Reward</h4>
                      </div>
                      <div className="space-y-1.5 pl-6">
                        {displaySkillIds.map(skillId => {
                          const specificSkill = guitarSkills.find(s => s.id === skillId);
                          const Icon = ((specificSkill && specificSkill.icon) || SKILL_CATEGORY_ICONS[skillId as keyof typeof SKILL_CATEGORY_ICONS] || FaCheck) as any;
                          return (
                            <div key={skillId} className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                              <Icon size={12} className="text-emerald-500/70 shrink-0" />
                              <span>
                                Earn <strong className="text-emerald-400">+{displayAmount}</strong> in <strong className="text-emerald-400">{getTranslatedSkill(skillId)}</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </>
                    )}

                    {hasLinks && !isPlayalong && supportAuthorBlock}
                  </div>
                )}
              </div>
            </div>
      </div>
  );
};
