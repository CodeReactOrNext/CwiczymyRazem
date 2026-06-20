import { motion } from "framer-motion";
import { Guitar, Headphones, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TbGuitarPick } from "react-icons/tb";

interface PracticeLoadingScreenProps {
  /** When true, the doors part (after the minimum delay) to reveal what's behind. */
  isReady: boolean;
  /** Fired once the reveal animation has fully finished. */
  onDone?: () => void;
}

const MIN_DELAY_MS = 1500;

// Door slide timing (must match the setTimeout that unmounts the overlay).
const DOOR_DELAY_MS = 180;
const DOOR_DURATION_MS = 700;

// Game-style "doors part to reveal the level" easing.
const DOOR_EASE = [0.76, 0, 0.24, 1] as const;

// Same tiled icon pattern as the session's BackgroundAmbiance. Each panel holds
// a full-viewport-width copy aligned to the same screen coordinates, so the
// pattern is continuous across the seam and then parts with the doors.
const PanelPattern = ({ align }: { align: "left" | "right" }) => (
  <svg
    className={`absolute inset-y-0 h-full w-screen text-cyan-400 opacity-[0.08] ${
      align === "left" ? "left-0" : "right-0"
    }`}
  >
    <defs>
      <pattern
        id={`practice-loader-pattern-${align}`}
        x="0"
        y="0"
        width="160"
        height="160"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-15)"
      >
        {/* Slow, seamless diagonal drift (one full tile = 160px, loops cleanly) */}
        <animateTransform
          attributeName="patternTransform"
          type="translate"
          additive="sum"
          from="0 0"
          to="160 160"
          dur="18s"
          repeatCount="indefinite"
        />
        <g transform="translate(20, 20)"><Guitar size={32} strokeWidth={1.5} /></g>
        <g transform="translate(100, 40)"><Music size={28} strokeWidth={1.5} /></g>
        <g transform="translate(40, 100)"><TbGuitarPick size={30} strokeWidth={1.5} /></g>
        <g transform="translate(110, 110)"><Headphones size={32} strokeWidth={1.5} /></g>
      </pattern>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" fill={`url(#practice-loader-pattern-${align})`} />
  </svg>
);

export const PracticeLoadingScreen = ({ isReady, onDone }: PracticeLoadingScreenProps) => {
  const [mounted, setMounted] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [done, setDone] = useState(false);

  // Portal target only exists on the client.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const revealing = isReady && minDelayDone;

  // Once the reveal starts, keep the overlay mounted until the doors finish,
  // then drop it and notify the parent.
  useEffect(() => {
    if (!revealing) return;
    const t = setTimeout(() => {
      setDone(true);
      onDone?.();
    }, DOOR_DELAY_MS + DOOR_DURATION_MS);
    return () => clearTimeout(t);
  }, [revealing, onDone]);

  if (!mounted || done) return null;

  // Rendered through a portal at <body> level with a max z-index, so it sits
  // above the session content (which is itself portalled to <body> on mobile).
  return createPortal(
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 2147483647 }}>
      {/* Left panel — slides off to the left on reveal, carrying the SVG bg */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-zinc-950"
        animate={{ x: revealing ? "-100%" : "0%" }}
        transition={{ duration: DOOR_DURATION_MS / 1000, delay: DOOR_DELAY_MS / 1000, ease: DOOR_EASE }}
      >
        <PanelPattern align="left" />
      </motion.div>
      {/* Right panel — slides off to the right on reveal, carrying the SVG bg */}
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-zinc-950"
        animate={{ x: revealing ? "100%" : "0%" }}
        transition={{ duration: DOOR_DURATION_MS / 1000, delay: DOOR_DELAY_MS / 1000, ease: DOOR_EASE }}
      >
        <PanelPattern align="right" />
      </motion.div>

      {/* Seam glow that splits open with the panels */}
      <motion.div
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"
        animate={{ scaleY: revealing ? 0 : 1, opacity: revealing ? 0 : 1 }}
        transition={{ duration: 0.35, ease: "easeIn" }}
      />

    </div>,
    document.body,
  );
};
