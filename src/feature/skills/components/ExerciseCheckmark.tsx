import { cn } from "assets/lib/utils";
import { Check, X } from "lucide-react";
import * as React from "react";

interface ExerciseCheckmarkProps extends React.ComponentPropsWithoutRef<"span"> {
  done: boolean;
}

export const ExerciseCheckmark = React.forwardRef<
  HTMLSpanElement,
  ExerciseCheckmarkProps
>(({ done, className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-5 w-5 flex-shrink-0 cursor-default items-center justify-center rounded border transition-transform hover:scale-110",
      done
        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
        : "border-white/5 bg-white/[0.02] text-zinc-600",
      className
    )}
    {...props}
  >
    {done ? (
      <Check className="h-3 w-3" strokeWidth={3} />
    ) : (
      <X className="h-3 w-3" strokeWidth={2.5} />
    )}
  </span>
));

ExerciseCheckmark.displayName = "ExerciseCheckmark";
