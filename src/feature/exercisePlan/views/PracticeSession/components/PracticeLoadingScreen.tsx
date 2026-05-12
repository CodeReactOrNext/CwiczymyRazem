import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PracticeLoadingScreenProps {
  isReady: boolean;
  onDone: () => void;
}

const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 0.6];

const MIN_DELAY_MS = 1200;

export const PracticeLoadingScreen = ({ isReady, onDone }: PracticeLoadingScreenProps) => {
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const shouldExit = isReady && minDelayDone;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!shouldExit && (
        <motion.div
          key="practice-loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

          {/* Waveform */}
          <div className="flex items-end gap-[5px] h-16 mb-10">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="w-[5px] rounded-full bg-cyan-400"
                animate={{
                  height: ["20%", `${h * 100}%`, "20%"],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
                style={{ height: "20%" }}
              />
            ))}
          </div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400"
          >
            Preparing your session…
          </motion.p>

          {/* Shimmer bar */}
          <div className="mt-6 w-48 h-[2px] rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
