import { Badge } from "assets/components/ui/badge";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "react-i18next";
import { Check, Clock, Info, Youtube, Video } from "lucide-react";
import { cn } from "assets/lib/utils";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: (exercise: Exercise) => void;
}

export const ExerciseCard = ({
  exercise,
  isSelected,
  onToggle,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["common", "exercises"]);

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const handleClick = () => onToggle(exercise);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex cursor-pointer flex-col justify-between rounded-xl border p-5 transition-all duration-200 ease-in-out hover:shadow-md",
        isSelected
          ? "border-cyan-500/50 bg-cyan-950/10 shadow-cyan-900/20"
          : "border-white/5 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
      )}
    >
      {/* Selection Checkbox */}
      <div className={cn(
        "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200",
        isSelected 
            ? "border-cyan-500 bg-cyan-500 text-white" 
            : "border-zinc-700 bg-zinc-950/50 text-transparent opacity-50 group-hover:block group-hover:opacity-100"
      )}>
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div>
          <h3 className={cn(
            "pr-8 font-semibold leading-tight tracking-tight transition-colors",
            isSelected ? "text-cyan-400" : "text-zinc-100 group-hover:text-white"
          )}>
            {exercise.title.en}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-zinc-400 group-hover:text-zinc-300">
            {exercise.description.en}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
           <div className={cn(
               "flex items-center gap-1.5 rounded-md bg-zinc-950/50 px-2 py-1 border border-white/5",
               isSelected ? "text-cyan-300 border-cyan-500/20 bg-cyan-950/30" : "group-hover:text-zinc-300 group-hover:border-zinc-700"
            )}>
                <Clock className="h-3.5 w-3.5" />
                <span>{exercise.timeInMinutes} min</span>
           </div>
           
           <Badge variant="outline" className={cn(
               "border-white/5 bg-zinc-950/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400",
                exercise.category === 'technique' && "text-emerald-400/90 border-emerald-500/20 bg-emerald-950/10",
                exercise.category === 'theory' && "text-blue-400/90 border-blue-500/20 bg-blue-950/10",
                exercise.category === 'creativity' && "text-purple-400/90 border-purple-500/20 bg-purple-950/10",
                exercise.category === 'hearing' && "text-amber-400/90 border-amber-500/20 bg-amber-950/10",
           )}>
              {t(`common:categories.${exercise.category}` as any)}
           </Badge>

           <Badge variant="outline" className={cn(
               "border-white/5 bg-zinc-950/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400",
                exercise.difficulty === 'easy' && "text-green-400/80",
                exercise.difficulty === 'medium' && "text-yellow-400/80",
                exercise.difficulty === 'hard' && "text-red-400/80",
           )}>
              {t(`common:difficulty.${exercise.difficulty}` as any)}
           </Badge>

           {exercise.isPlayalong && (
               <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] px-1.5 h-5 font-bold uppercase">
                   <Youtube className="mr-1 h-2.5 w-2.5" />
                   Playalong
               </Badge>
           )}
           {exercise.videoUrl && !exercise.isPlayalong && (
               <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] px-1.5 h-5 font-bold uppercase">
                   <Video className="mr-1 h-2.5 w-2.5" />
                   Video
               </Badge>
           )}
        </div>
      </div>
      
      {/* Footer / Skills */}
      {skills.length > 0 && (
         <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill) => (
                <span 
                    key={skill?.id} 
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-400 transition-colors group-hover:bg-zinc-800 group-hover:text-zinc-300"
                >
                    {skill ? t(`common:skills.${skill.id}` as any) : ""}
                </span>
            ))}
            {skills.length > 3 && (
                <span className="inline-flex items-center px-1.5 text-[10px] text-zinc-500">
                    +{skills.length - 3}
                </span>
            )}
         </div>
      )}
    </div>
  );
};
