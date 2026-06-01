import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { Clock, ListChecks, Play } from "lucide-react";
import { useRouter } from "next/router";

interface ActivityStartModalProps {
  plan?: ExercisePlan | null;
  exercise?: Exercise | null;
  onClose: () => void;
}

const formatDuration = (minutes: number) =>
  minutes < 1 ? `${Math.round(minutes * 60)}s` : `${Math.round(minutes)} min`;

export const ActivityStartModal = ({ plan, exercise, onClose }: ActivityStartModalProps) => {
  const router = useRouter();

  const open = !!plan || !!exercise;
  if (!open) return null;

  const title = plan ? plan.title : exercise!.title;
  const description = plan ? plan.description : exercise!.description;
  const difficulty = plan ? plan.difficulty : exercise!.difficulty;
  const category = plan ? plan.category : exercise!.category;
  const totalDuration = plan
    ? plan.exercises.reduce((acc, ex) => acc + ex.timeInMinutes, 0)
    : exercise!.timeInMinutes;

  const handleStart = () => {
    if (plan) {
      router.push(`/timer/plans?planId=${plan.id}`);
    } else if (exercise) {
      router.push(`/practice/exercise/${exercise.id}`);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-950/95 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden !rounded-[12px] flex flex-col">
        <div className="relative p-6 pt-7 pb-5 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
          <DialogHeader className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">
              {plan ? "Plan" : "Exercise"}
            </span>
            <DialogTitle className="text-xl font-black text-white leading-tight mt-1">
              {title}
            </DialogTitle>
            {description && (
              <p className="mt-2 text-[13px] text-zinc-400 font-medium leading-relaxed">
                {description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-zinc-900/80 border-white/10 text-white flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                {formatDuration(totalDuration)}
              </Badge>
              <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                {difficulty}
              </Badge>
              <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-white/5 border-white/10 text-zinc-300">
                {category}
              </Badge>
              {plan && (
                <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-white/5 border-white/10 text-zinc-300 flex items-center gap-1.5">
                  <ListChecks className="w-3 h-3 text-zinc-400" />
                  {plan.exercises.length}
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {plan && plan.exercises.length > 0 && (
          <div className="px-6 py-5 max-h-[40vh] overflow-y-auto scrollbar-premium">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Exercises
            </h4>
            <ul className="space-y-2">
              {plan.exercises.map((ex, i) => (
                <li key={`${ex.id}-${i}`} className="flex items-center gap-3 text-[13px] text-zinc-300">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/50 text-[10px] font-bold text-zinc-500 shrink-0 border border-white/5">
                    {i + 1}
                  </span>
                  <span className="flex-1 leading-snug">{ex.title}</span>
                  <span className="text-[11px] text-zinc-500 shrink-0">{formatDuration(ex.timeInMinutes)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end p-5 border-t border-white/5 bg-zinc-950/40 gap-3">
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[11px] rounded-[8px]">
            Close
          </Button>
          <Button onClick={handleStart} className="font-bold uppercase tracking-widest text-[11px] rounded-[8px] gap-2">
            Start
            <Play className="w-3 h-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
