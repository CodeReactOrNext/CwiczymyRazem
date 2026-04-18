import { Check } from "lucide-react";
import { cn } from "assets/lib/utils";

interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const OnboardingProgress = ({ currentStep, totalSteps, labels }: Props) => {
  return (
    <div className='flex items-center gap-2'>
      {labels.map((label, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={label} className='flex items-center gap-2'>
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-black tabular-nums transition-all",
                isActive && "border-orange-400/50 bg-orange-500/10 text-orange-400",
                isDone && "border-orange-400/30 bg-orange-500/20 text-orange-300",
                !isActive && !isDone && "border-white/10 bg-zinc-900/50 text-zinc-600"
              )}>
              {isDone ? <Check className='h-3.5 w-3.5' strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wider transition-colors",
                isActive && "text-white",
                isDone && "text-orange-300/70",
                !isActive && !isDone && "text-zinc-600"
              )}>
              {label}
            </span>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors",
                  isDone ? "bg-orange-400/40" : "bg-white/5"
                )}
              />
            )}
          </div>
        );
      })}
      <span className='ml-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600'>
        · {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
};
