import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";

/**
 * Shown in the player slot for "open" exercises that have no tablature/player on
 * purpose (see isOpenExercise). It fills the space where users expect a tab with
 * a clear, friendly message so the exercise doesn't read as broken — and points
 * them down to the instructions they need to follow.
 */
interface OpenExercisePanelProps {
  /** Tighter spacing for the mobile content column. */
  compact?: boolean;
}

/** A compass over faded "tab string" lines: there's no fixed tab — you chart it. */
const OpenExerciseArt = ({ size = 76 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 76 76"
    fill="none"
    aria-hidden="true"
    className="shrink-0">
    <defs>
      <linearGradient id="oe-grad" x1="14" y1="14" x2="62" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a5b4fc" />
        <stop offset="1" stopColor="#c4b5fd" />
      </linearGradient>
      <radialGradient id="oe-glow" cx="38" cy="38" r="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" stopOpacity="0.28" />
        <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Faded "tab" string lines behind the compass */}
    <g stroke="#a5b4fc" strokeWidth="1" opacity="0.18">
      {[20, 28, 36, 44, 52, 60].map((y) => (
        <line key={y} x1="2" y1={y} x2="74" y2={y} strokeDasharray="2 4" />
      ))}
    </g>

    <circle cx="38" cy="38" r="34" fill="url(#oe-glow)" />

    {/* Compass dial */}
    <circle cx="38" cy="38" r="25" stroke="url(#oe-grad)" strokeWidth="2" fill="#1e1b3a" fillOpacity="0.55" />
    <circle cx="38" cy="38" r="25" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />

    {/* Cardinal ticks */}
    <g stroke="url(#oe-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.7">
      <line x1="38" y1="16" x2="38" y2="21" />
      <line x1="38" y1="55" x2="38" y2="60" />
      <line x1="16" y1="38" x2="21" y2="38" />
      <line x1="55" y1="38" x2="60" y2="38" />
    </g>

    {/* Needle, tilted to feel like it's exploring */}
    <g transform="rotate(34 38 38)">
      <path d="M38 19 L43 38 L38 36 Z" fill="url(#oe-grad)" />
      <path d="M38 19 L33 38 L38 36 Z" fill="#818cf8" fillOpacity="0.55" />
      <path d="M38 57 L43 38 L38 40 Z" fill="#6366f1" fillOpacity="0.35" />
      <path d="M38 57 L33 38 L38 40 Z" fill="#6366f1" fillOpacity="0.2" />
    </g>
    <circle cx="38" cy="38" r="3.2" fill="#0f0e1c" stroke="url(#oe-grad)" strokeWidth="1.6" />
  </svg>
);

export const OpenExercisePanel = ({ compact }: OpenExercisePanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        "bg-gradient-to-br from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent",
        compact ? "p-4" : "p-6 md:p-8"
      )}>
      {/* Soft corner glow */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

      <div
        className={cn(
          "relative flex items-center gap-4",
          compact ? "flex-row gap-4" : "flex-col text-center sm:flex-row sm:text-left sm:gap-6"
        )}>
        <OpenExerciseArt size={compact ? 60 : 76} />

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2 sm:justify-start" >
            <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Open Exercise
            </span>
          </div>

          <h3 className={cn("font-bold text-white tracking-tight", compact ? "text-base" : "text-lg sm:text-xl")}>
            No tab for this one — it&apos;s open-ended.
          </h3>

          <p className={cn("mt-1.5 leading-relaxed text-zinc-400", compact ? "text-sm" : "text-sm sm:text-[15px]")}>
            Some exercises can&apos;t be captured in a tab — this is one of them. It&apos;s
            guided by the steps below, so work through them at your own pace.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300/80">
            <span className="animate-bounce">↓</span>
            Read the instructions below to get started
          </div>
        </div>
      </div>
    </motion.div>
  );
};
