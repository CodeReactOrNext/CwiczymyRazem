import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
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
      {/* One padded card: header, meta and actions are separated by spacing
          rather than the rules the modal used to draw across itself. */}
      {/* No `relative` here — DialogContent is `fixed` (which already anchors the
          absolute decorations below), and tailwind-merge would drop the `fixed`. */}
      <DialogContent className="flex flex-col gap-6 overflow-hidden rounded-lg bg-zinc-950/95 p-6 backdrop-blur-3xl sm:max-w-[480px]">
        {/* Cyan wash over the top of the card — same treatment the header block
            used to carry, now spanning the whole (borderless) panel. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-500/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_70%)]" />

        <DialogHeader className="relative space-y-2 text-left">
          <span className="text-xs font-semibold text-cyan-400">
            {plan ? "Plan" : "Exercise"}
          </span>
          <DialogTitle className="pr-10 text-xl font-bold leading-tight text-zinc-100">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          )}
        </DialogHeader>

        {/* Uppercase kept on request — it is the look the owner signed off on,
            styleguide rule #11 notwithstanding. */}
        <div className="relative flex flex-wrap items-center gap-2 uppercase tracking-wider">
          <Chip color="cyan">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(totalDuration)}
          </Chip>
          <Chip color="emerald">{difficulty}</Chip>
          <Chip>{category}</Chip>
          {plan && (
            <Chip>
              <ListChecks className="h-3.5 w-3.5 text-zinc-400" />
              {plan.exercises.length}
            </Chip>
          )}
        </div>

        {plan && plan.exercises.length > 0 && (
          <div className="relative max-h-[40vh] overflow-y-auto scrollbar-premium">
            <h4 className="mb-3 text-xs font-semibold text-zinc-500">
              Exercises
            </h4>
            <ul className="space-y-3">
              {plan.exercises.map((ex, i) => (
                <li key={`${ex.id}-${i}`} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-[10px] font-semibold text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="flex-1 leading-snug">{ex.title}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{formatDuration(ex.timeInMinutes)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Kept as they were on request — the uppercase pair is the look the
            owner signed off on, styleguide rule #11 notwithstanding. */}
        <div className="relative flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[11px] rounded-[8px]">
            Close
          </Button>
          {/* Button wraps its children in its own flex span, so the variant's
              `gap-2` never reaches the icon — the margin has to live here. */}
          <Button onClick={handleStart} className="font-bold uppercase tracking-widest text-[11px] rounded-[8px]">
            Start
            <Play className="ml-2 w-3 h-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
