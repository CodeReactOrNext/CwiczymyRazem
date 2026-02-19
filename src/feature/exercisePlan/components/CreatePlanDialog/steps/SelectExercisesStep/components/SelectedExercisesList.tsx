import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Edit2, Copy, Trash2, GripVertical } from "lucide-react";

interface SelectedExercisesListProps {
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
  onEditExercise?: (exercise: Exercise) => void;
  onCloneExercise?: (exercise: Exercise) => void;
}

export const SelectedExercisesList = ({
  selectedExercises,
  onToggleExercise,
  onEditExercise,
  onCloneExercise,
}: SelectedExercisesListProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const totalDuration = selectedExercises.reduce(
    (total, exercise) => total + exercise.timeInMinutes,
    0
  );


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className='rounded-xl border border-white/10 bg-zinc-900/20 p-5 shadow-inner min-h-[200px] flex flex-col min-w-0'>
      <div className='flex items-center justify-between mb-5 shrink-0'>
        <div className="space-y-0.5">
          <h3 className='text-sm font-semibold text-zinc-100 flex items-center gap-2'>
            <span className={cn(
                "w-1.5 h-1.5 rounded-full bg-cyan-500",
                selectedExercises.length > 0 && "animate-pulse"
            )} />
            {t("exercises:my_plans.create_dialog.selected_exercises", {
              count: selectedExercises.length,
            })}
          </h3>
          <p className="text-[10px] text-zinc-500 font-medium tracking-tight">
            {selectedExercises.length > 0 ? "Review and manage your plan items" : "Your plan is empty"}
          </p>
        </div>
        {selectedExercises.length > 0 && (
            <div className='flex items-center gap-2 rounded-lg bg-zinc-950/50 px-3 py-1.5 border border-white/5'>
                <Clock className='h-3.5 w-3.5 text-cyan-400' />
                <span className="text-sm font-bold text-zinc-200">{totalDuration} <span className="text-zinc-500 font-normal">min</span></span>
            </div>
        )}
      </div>

      <div className="flex-1">
        {selectedExercises.length > 0 ? (
            <div className='grid gap-3'>
                {selectedExercises.map((exercise) => {
                    const isCustom = typeof exercise.id === 'string' && exercise.id.startsWith("custom-");
                    
                    return (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={item}
                        key={exercise.id}
                        className='group relative flex items-start gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-sm min-w-0'>
                        
                        <div className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 pt-1">
                        <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                        <h4 className='font-bold text-zinc-100 text-sm sm:text-base leading-tight break-words' title={exercise.title}>
                            {exercise.title}
                        </h4>
                        <div className='flex items-center gap-3 mt-1 text-[11px] font-medium text-zinc-500 tracking-wide'>
                            <div className="flex items-center gap-1">
                            <Clock className='h-3 w-3' />
                            <span>{exercise.timeInMinutes} min</span>
                            </div>
                            {isCustom && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/90 border border-cyan-500/20 text-[9px]">
                                Custom
                            </span>
                            )}
                        </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {isCustom && (
                            <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditExercise?.(exercise)}
                                className='h-10 w-10 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all'
                                title={t("exercises:custom_exercise.edit_button")}>
                                <Edit2 className='h-4 w-4' />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onCloneExercise?.(exercise)}
                                className='h-10 w-10 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all'
                                title={t("exercises:custom_exercise.clone_button")}>
                                <Copy className='h-4 w-4' />
                            </Button>
                            </>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleExercise(exercise)}
                            className='h-10 w-10 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all'
                            title={t("common:button.remove")}>
                            <Trash2 className='h-4 w-4' />
                        </Button>
                        </div>
                    </motion.div>
                    );
                })}
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 text-zinc-600">
                    <Trash2 className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-zinc-400 font-medium text-sm leading-relaxed max-w-[180px]">
                    No exercises selected yet. 
                    <span className="block text-zinc-600 text-[11px] mt-1 tracking-wider text-balance">Choose from the library below</span>
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
