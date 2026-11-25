import { cn } from "assets/lib/utils";

/** The difficulty in its own colour, as a filled bar of four. */
export const DIFFICULTY_LEVELS: Record<string, { bars: number; color: string; text: string }> = {
  beginner: { bars: 1, color: "bg-sky-400", text: "text-sky-400" },
  easy: { bars: 2, color: "bg-emerald-400", text: "text-emerald-400" },
  medium: { bars: 3, color: "bg-amber-400", text: "text-amber-400" },
  hard: { bars: 4, color: "bg-rose-400", text: "text-rose-400" },
};

/**
 * Four rising bars, as many filled as the difficulty is high. Renders nothing
 * for a difficulty it doesn't know.
 */
export const DifficultyBars = ({ difficulty, size = "md" }: { difficulty: string; size?: "sm" | "md" }) => {
  const level = DIFFICULTY_LEVELS[difficulty];
  if (!level) return null;
  const step = size === "sm" ? 1.5 : 2;
  return (
    <span aria-hidden className={cn("flex items-end", size === "sm" ? "gap-0.5" : "gap-1")}>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(size === "sm" ? "w-[3px] rounded-[1px]" : "w-1 rounded-sm", bar <= level.bars ? level.color : "bg-zinc-700")}
          style={{ height: (size === "sm" ? 3 : 4) + bar * step }}
        />
      ))}
    </span>
  );
};
