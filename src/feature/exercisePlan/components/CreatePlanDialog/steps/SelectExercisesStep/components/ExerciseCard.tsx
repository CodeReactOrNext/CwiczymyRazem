import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock, Plus, Video, Youtube, X, Info } from "lucide-react";
import { TablaturePreview } from "./TablaturePreview";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: (exercise: Exercise) => void;
  isLocked?: boolean;
  onUpgrade?: () => void;
  onPreview?: (exercise: Exercise) => void;
}

export const ExerciseCard = ({
  exercise,
  isSelected,
  onToggle,
  isLocked = false,
  onUpgrade,
  onPreview,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["common", "exercises"]);

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
        "group relative flex flex-col rounded-[8px] border border-transparent transition-all duration-500 cursor-pointer overflow-hidden",
        "active:scale-[0.98]",
        isLocked
          ? "bg-zinc-950/40 ring-1 ring-inset ring-amber-500/20"
          : isSelected
            ? "bg-zinc-900/40 ring-1 ring-inset ring-cyan-500/50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]"
            : "bg-zinc-900/20 ring-1 ring-inset ring-white/5 hover:ring-white/15 hover:bg-zinc-800/40"
      )}
    >
      {/* Top Colorful Line effect */}
      {!isLocked && (
        <div className={cn(
          "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r opacity-40 group-hover:opacity-100 transition-opacity duration-500",
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
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}
      {isSelected && (
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none" />
      )}

      {/* Main content wrapper */}
      <div className="relative flex flex-col sm:flex-row items-stretch min-h-[90px]">
        {/* Texts & Badges */}
        <div className="flex-1 min-w-0 p-4 pb-5 sm:p-5 flex flex-col justify-center">
          <div>
            <h3 className={cn(
              "font-semibold text-[15px] sm:text-[16px] leading-tight tracking-tight transition-colors duration-300",
              isLocked ? "text-zinc-500" : isSelected ? "text-cyan-300" : "text-zinc-100 group-hover:text-white"
            )}>
              {exercise.title}
            </h3>
            <p className={cn(
              "mt-1.5 text-[13px] sm:text-[14px] line-clamp-1 sm:line-clamp-2 leading-relaxed transition-colors duration-300 pr-2",
              isLocked ? "text-zinc-600" : "text-zinc-500 group-hover:text-zinc-300"
            )}>
              {exercise.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4">
            <Badge variant="outline" className={cn(
              "px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-[8px] border-white/5 bg-white/5 backdrop-blur-md shadow-none transition-colors duration-300",
              exercise.category === "technique"  && "text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10",
              exercise.category === "theory"     && "text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10",
              exercise.category === "creativity" && "text-purple-400 group-hover:border-purple-500/30 group-hover:bg-purple-500/10",
              exercise.category === "hearing"    && "text-amber-400 group-hover:border-amber-500/30 group-hover:bg-amber-500/10",
            )}>
              {t(`common:categories.${exercise.category}` as any)}
            </Badge>

            <Badge variant="outline" className={cn(
              "px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-[8px] border-white/5 bg-white/5 backdrop-blur-md shadow-none transition-colors duration-300",
              exercise.difficulty === "easy"   && "text-green-400 group-hover:border-green-500/30 group-hover:bg-green-500/10",
              exercise.difficulty === "medium" && "text-yellow-400 group-hover:border-yellow-500/30 group-hover:bg-yellow-500/10",
              exercise.difficulty === "hard"   && "text-red-400 group-hover:border-red-500/30 group-hover:bg-red-500/10",
            )}>
              {t(`common:difficulty.${exercise.difficulty}` as any)}
            </Badge>

            {exercise.isPlayalong && (
              <Badge className="bg-red-500/10 text-red-500 border-transparent text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded-[8px] shadow-none">
                <Youtube className="mr-1 h-3.5 w-3.5" />Playalong
              </Badge>
            )}
            {exercise.videoUrl && !exercise.isPlayalong && (
              <Badge className="bg-cyan-500/10 text-cyan-500 border-transparent text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded-[8px] shadow-none">
                <Video className="mr-1 h-3.5 w-3.5" />Video
              </Badge>
            )}

            {skills.map((skill) => {
              if (!skill) return null;
              const Icon = skill.icon;
              return (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 mt-0.5 sm:mt-0 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors bg-white/[0.03] border border-white/5 rounded-[8px]"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                  {t(`common:skills.${skill.id}` as any)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Desktop Right Side: Tablature -> Action Button */}
        <div className="hidden sm:flex shrink-0 items-center pr-5">
          {/* Tablature Preview Desktop */}
          {exercise.tablature && exercise.tablature.length > 0 && (
            <div className="relative w-[220px] shrink-0 opacity-40 group-hover:opacity-90 transition-opacity duration-500 flex items-center justify-end pr-5">
               <TablaturePreview measures={exercise.tablature} />
            </div>
          )}

          {/* Action button on Desktop */}
          {isLocked ? (
            <div className="flex items-center gap-1.5 rounded-[8px] bg-amber-500/10 px-3 py-1.5 ring-1 ring-amber-500/20 shadow-sm">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pro</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreview?.(exercise); }}
                className="flex items-center justify-center min-w-[36px] h-[36px] rounded-[8px] transition-all duration-300 shadow-sm overflow-hidden bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)] ring-1 ring-white/10 hover:scale-105"
                title="Preview Exercise Details"
              >
                <Info className="h-4 w-4" />
              </button>
              <div className={cn(
                "flex items-center justify-center min-w-[36px] h-[36px] rounded-[8px] transition-all duration-500 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)] overflow-hidden shrink-0",
                isSelected
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:ring-red-500/30"
                  : "bg-white/5 text-zinc-300 ring-1 ring-white/10 group-hover:bg-cyan-500 group-hover:text-black group-hover:ring-cyan-500 group-hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.6)] group-hover:scale-105"
              )}>
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4 group-hover:hidden transition-transform" strokeWidth={2.5} />
                    <X className="h-4 w-4 hidden group-hover:block transition-transform" strokeWidth={2.5} />
                  </>
                ) : (
                  <Plus className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" strokeWidth={2.5} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Action Button */}
        <div className="sm:hidden w-full border-t border-white/5 py-3 px-4 flex justify-between items-center bg-white/[0.02]">
           <span className="text-[12px] font-medium text-zinc-400">
             {isSelected ? "Exercise added" : "Pick this exercise"}
           </span>
           {isLocked ? (
             <div className="flex items-center gap-1.5 rounded-[8px] bg-amber-500/10 px-3 py-1.5 ring-1 ring-amber-500/20 shadow-sm">
               <Lock className="h-3.5 w-3.5 text-amber-500" />
               <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pro</span>
             </div>
           ) : (
             <div className="flex flex-row items-center gap-2">
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); onPreview?.(exercise); }}
                 className="flex items-center justify-center min-w-[36px] h-[36px] rounded-[8px] transition-all duration-300 shadow-sm overflow-hidden bg-white/5 text-zinc-400 ring-1 ring-white/10"
               >
                 <Info className="h-4 w-4" />
               </button>
               <div className={cn(
                 "flex items-center justify-center min-w-[36px] h-[36px] rounded-[8px] transition-all duration-500 shadow-sm overflow-hidden",
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
