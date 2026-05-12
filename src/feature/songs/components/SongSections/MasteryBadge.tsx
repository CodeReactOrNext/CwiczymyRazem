import { cn } from "assets/lib/utils";
import type { MasteryLevel } from "feature/songs/types/songSection.type";
import { MASTERY_LABELS } from "feature/songs/types/songSection.type";
import { useEffect, useRef, useState } from "react";

const MASTERY_STYLES: Record<MasteryLevel, string> = {
  0: "text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-700",
  1: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/15",
  2: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15",
  3: "text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/15",
  4: "text-zinc-400 bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 line-through",
};

const OPTION_STYLES: Record<MasteryLevel, string> = {
  0: "text-zinc-500 hover:bg-white/5",
  1: "text-red-400 hover:bg-red-500/10",
  2: "text-amber-400 hover:bg-amber-500/10",
  3: "text-green-400 hover:bg-green-500/10",
  4: "text-zinc-400 hover:bg-zinc-800",
};

interface MasteryBadgeProps {
  mastery: MasteryLevel;
  onChange: (m: MasteryLevel) => void;
  readonly?: boolean;
}

export const MasteryBadge = ({ mastery, onChange, readonly }: MasteryBadgeProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (readonly) {
    return (
      <span className={cn("px-2 py-0.5 rounded-lg border text-xs font-medium", MASTERY_STYLES[mastery])}>
        {MASTERY_LABELS[mastery]}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "px-2 py-0.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap",
          MASTERY_STYLES[mastery]
        )}
      >
        {MASTERY_LABELS[mastery]}
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 right-0 z-50 bg-zinc-950 border border-white/10 rounded-xl p-1 shadow-2xl min-w-[130px]">
          {([0, 1, 2, 3, 4] as MasteryLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                onChange(level);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                mastery === level ? "font-semibold" : "opacity-80",
                OPTION_STYLES[level],
                level === 4 && "line-through"
              )}
            >
              {MASTERY_LABELS[level]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
