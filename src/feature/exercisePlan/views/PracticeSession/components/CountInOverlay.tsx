import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

interface CountInOverlayProps {
  /** Remaining count-in beats (e.g. 4 → 3 → 2 → 1). `0` or less hides the overlay. */
  count: number;
  /** Playback tempo — the ring drains over exactly one beat so the motion stays in time. */
  bpm: number;
  className?: string;
}

const R = 54;

/**
 * Count-in overlay shown before playback starts. The big number is driven by
 * discrete metronome ticks (4 → 3 → 2 → 1), so on its own it would just snap
 * between values and feel frozen. To make it read as smooth and in-time:
 *  - a cyan ring drains over one whole beat, giving continuous motion between numbers;
 *  - each number re-mounts (`key={count}`) so its spring pop re-fires every beat.
 */
function CountInOverlayInner({ count, bpm, className }: CountInOverlayProps) {
  // Clamp so a missing/extreme bpm can't make the ring animation crawl or flicker.
  const beatSec = Math.min(2, Math.max(0.25, 60 / (bpm || 60)));

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/70 backdrop-blur-[2px]",
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}>
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx={60} cy={60} r={R} fill="none" stroke="rgb(39 39 42)" strokeWidth={2.5} />
              <motion.circle
                key={count}
                cx={60}
                cy={60}
                r={R}
                fill="none"
                stroke="rgb(34 211 238)"
                strokeWidth={2.5}
                strokeLinecap="round"
                initial={{ pathLength: 1 }}
                animate={{ pathLength: 0 }}
                transition={{ duration: beatSec, ease: "linear" }}
              />
            </svg>

            {/* Number drawn as SVG text: dominant-baseline="central" centres the glyph
                geometrically, immune to the font's line-box metrics (Teko digits otherwise
                sit high). The pop lives on the wrapping HTML motion.div so scaling stays
                anchored to the ring centre. */}
            <AnimatePresence>
              <motion.div
                key={count}
                className="absolute inset-0"
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}>
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  {/* y=65.5, not 60: Teko's em box is top-heavy (ascent 75 vs descent 37),
                      so `central` leaves the digit ink ~5.5u high — nudge the baseline down
                      to sit the ink on the true centre. */}
                  <text
                    x={60}
                    y={65.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-teko"
                    fill="rgb(244 244 245)"
                    fontSize={78}>
                    {count}
                  </text>
                </svg>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const CountInOverlay = memo(CountInOverlayInner);
