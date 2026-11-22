import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { getCategoryChipColor } from "feature/exercisePlan/constants/categoryChip";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { Check, Heart, Info,Lock, Plus, Video, X } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

import { TablaturePreview } from "./TablaturePreview";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: (exercise: Exercise) => void;
  isLocked?: boolean;
  onUpgrade?: () => void;
  onPreview?: (exercise: Exercise) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** The user owns this exercise but hasn't published it — it's still usable in a plan. */
  isPrivate?: boolean;
}

export const ExerciseCard = ({
  exercise,
  isSelected,
  onToggle,
  isLocked = false,
  onUpgrade,
  onPreview,
  isFavorite = false,
  onToggleFavorite,
  isPrivate = false,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["common", "exercises", "plans"]);
  const localizeExercise = useLocalizeExercise();

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const handleClick = () => {
    if (isLocked) { onUpgrade?.(); return; }
    onToggle(exercise);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col rounded-lg border border-transparent transition-all duration-slow cursor-pointer overflow-hidden",
        "active:scale-[0.98]",
        isLocked
          ? "bg-zinc-950/40 ring-1 ring-inset ring-amber-500/20"
          : isSelected
            ? "bg-zinc-900/40 ring-1 ring-inset ring-cyan-500/50"
            : "bg-zinc-900/20 ring-1 ring-inset ring-white/5 hover:ring-white/15 hover:bg-zinc-800/40"
      )}
    >
      {/* Top Colorful Line effect */}
      {!isLocked && (
        <div className={cn(
          "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r opacity-40 group-hover:opacity-100 transition-opacity duration-slow",
          isSelected
            ? "from-cyan-500/40 via-cyan-400 to-cyan-500/40"
            : exercise.category === "technique" ? "from-emerald-500/0 via-emerald-500 to-emerald-500/0" :
              exercise.category === "theory" ? "from-blue-500/0 via-blue-500 to-blue-500/0" :
              exercise.category === "creativity" ? "from-purple-500/0 via-purple-500 to-purple-500/0" :
              "from-amber-500/0 via-amber-500 to-amber-500/0"
        )} />
      )}

      {/* Subtle radial glow in background */}
      {!isLocked && !isSelected && (
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-slow pointer-events-none" />
      )}
      {isSelected && (
         <div className="absolute inset-0 light-hide bg-[radial-gradient(ellipse_at_50%_-20%,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none" />
      )}

      {/* Main content wrapper */}
      <div className="relative flex flex-col sm:flex-row items-stretch min-h-[90px]">
        {/* Texts & Badges */}
        <div className="flex-1 min-w-0 p-4 pb-5 sm:p-5 flex flex-col justify-center">
          <div>
            <h3 className={cn(
              "font-semibold text-[15px] sm:text-[16px] leading-tight tracking-tight transition-colors duration-base",
              isLocked ? "text-zinc-500" : isSelected ? "text-cyan-300" : "text-zinc-100 group-hover:text-white"
            )}>
              {localizeExercise(exercise).title}
            </h3>
            <p className={cn(
              "mt-1.5 text-[13px] sm:text-[14px] line-clamp-1 sm:line-clamp-2 leading-relaxed transition-colors duration-base pr-2",
              isLocked ? "text-zinc-600" : "text-zinc-500 group-hover:text-zinc-300"
            )}>
              {localizeExercise(exercise).description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4">
            <Chip color={getCategoryChipColor(exercise.category)} size='sm'>
              {t(`common:categories.${exercise.category}` as any)}
            </Chip>

            <Chip color='gray' size='sm'>
              {t(`common:difficulty.${exercise.difficulty}` as any)}
            </Chip>

            {isPrivate && (
              <Chip color='gray' size='sm'>
                <Lock className="h-3 w-3" />{t("plans:private")}
              </Chip>
            )}

            {exercise.isPlayalong && (
              <Chip color='gray' size='sm'>
                <FaYoutube className="h-3.5 w-3.5 text-red-500" />{t("plans:playalong")}
              </Chip>
            )}
            {exercise.videoUrl && !exercise.isPlayalong && (
              <Chip color='gray' size='sm'>
                <Video className="h-3.5 w-3.5" />{t("plans:video")}
              </Chip>
            )}

            {skills.map((skill) => {
              if (!skill) return null;
              const Icon = skill.icon;
              return (
                <Chip key={skill.id} color='gray' size='sm' className='text-zinc-400'>
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                  {t(`common:skills.${skill.id}` as any)}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Desktop Right Side: Tablature -> Action Button */}
        <div className="hidden sm:flex shrink-0 items-center pr-5">
          {/* Tablature Preview Desktop */}
          {exercise.tablature && exercise.tablature.length > 0 && (
            <div className="relative w-[220px] shrink-0 opacity-40 group-hover:opacity-90 transition-opacity duration-slow flex items-center justify-end pr-5">
               <TablaturePreview measures={exercise.tablature} />
            </div>
          )}

          {/* Action button on Desktop */}
          {isLocked ? (
            <Chip color='amber'>
              <Lock className="h-3.5 w-3.5" />
              {t("plans:pro")}
            </Chip>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleFavorite && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                  aria-label={isFavorite ? t("plans:remove_favorite") : t("plans:add_favorite")}
                  aria-pressed={isFavorite}
                  // Favourited = the heart lights up; the face stays the same key.
                  className={cn(
                    "shrink-0",
                    isFavorite ? "text-rose-400 hover:text-rose-300" : "text-zinc-400 hover:text-rose-300"
                  )}
                  title={isFavorite ? t("plans:remove_favorite") : t("plans:add_favorite")}
                >
                  <Heart className={cn(isFavorite && "fill-current")} />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onPreview?.(exercise); }}
                className="shrink-0 text-zinc-400"
                title={t("plans:preview_details")}
                aria-label={t("plans:preview_details")}
              >
                <Info />
              </Button>
              <div className={cn(
                "flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-slow overflow-hidden shrink-0",
                isSelected
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:ring-red-500/30"
                  : "bg-white/5 text-zinc-300 ring-1 ring-white/10 group-hover:bg-cyan-500 group-hover:text-black group-hover:ring-cyan-500"
              )}>
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4 group-hover:hidden transition-transform" strokeWidth={2.5} />
                    <X className="h-4 w-4 hidden group-hover:block transition-transform" strokeWidth={2.5} />
                  </>
                ) : (
                  <Plus className="h-4 w-4 transition-transform duration-slow group-hover:rotate-90" strokeWidth={2.5} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Action Button */}
        <div className="sm:hidden w-full border-t border-white/5 py-3 px-4 flex justify-between items-center bg-white/[0.02]">
           <span className="text-[12px] font-medium text-zinc-400">
             {isSelected ? t("plans:card.exercise_added") : t("plans:card.pick_exercise")}
           </span>
           {isLocked ? (
             <Chip color='amber'>
               <Lock className="h-3.5 w-3.5" />
               {t("plans:pro")}
             </Chip>
           ) : (
             <div className="flex flex-row items-center gap-2">
               {onToggleFavorite && (
                 <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                   aria-label={isFavorite ? t("plans:remove_favorite") : t("plans:add_favorite")}
                   aria-pressed={isFavorite}
                   className={cn("shrink-0", isFavorite ? "text-rose-400" : "text-zinc-400")}
                 >
                   <Heart className={cn(isFavorite && "fill-current")} />
                 </Button>
               )}
               <Button
                 type="button"
                 variant="ghost"
                 size="icon"
                 onClick={(e) => { e.stopPropagation(); onPreview?.(exercise); }}
                 className="shrink-0 text-zinc-400"
                 aria-label={t("plans:preview_details")}
               >
                 <Info />
               </Button>
               <div className={cn(
                 "flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-slow overflow-hidden",
                 isSelected
                   ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                   : "bg-white/5 text-zinc-300 ring-1 ring-white/10"
               )}>
                 {isSelected ? (
                   <Check className="h-4 w-4" strokeWidth={2.5} />
                 ) : (
                   <Plus className="h-4 w-4" strokeWidth={2.5} />
                 )}
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
