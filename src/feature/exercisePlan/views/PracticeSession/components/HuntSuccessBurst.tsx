import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface HuntSuccessBurstProps {
  /** How many units (octaves / chord tones) are currently found. */
  foundCount: number;
  /** True once the whole goal is complete. */
  complete: boolean;
}

/**
 * Absolute overlay (place inside the goal card's `relative` wrapper). Fires a
 * small ring once per NEWLY found unit (never re-fires for an already-found one),
 * and a bigger one-shot celebration when the whole goal is completed.
 */
export function HuntSuccessBurst({ foundCount, complete }: HuntSuccessBurstProps) {
  const [hitKey, setHitKey] = useState(0);
  const [doneKey, setDoneKey] = useState(0);
  const prevFound = useRef(foundCount);
  const prevComplete = useRef(complete);

  useEffect(() => {
    if (foundCount > prevFound.current) setHitKey(k => k + 1);
    prevFound.current = foundCount;
  }, [foundCount]);

  useEffect(() => {
    if (complete && !prevComplete.current) setDoneKey(k => k + 1);
    prevComplete.current = complete;
  }, [complete]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* One ring per newly found unit (keyed so it animates exactly once). */}
      {hitKey > 0 && !complete && (
        <motion.div
          key={`hit-${hitKey}`}
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute inset-0 rounded-lg ring-4 ring-emerald-400"
        />
      )}

      {/* Whole-goal celebration. */}
      {doneKey > 0 && complete && (
        <div key={`done-${doneKey}`} className="absolute inset-0">
          <motion.div
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 rounded-lg ring-4 ring-emerald-300"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
            className="absolute inset-0 rounded-lg ring-4 ring-amber-300"
          />
          {Array.from({ length: 10 }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * 80, y: Math.sin(angle) * 80, opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
