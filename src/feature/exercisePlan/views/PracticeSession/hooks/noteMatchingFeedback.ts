export const feedbackStyles: Record<string, { color: string; dropShadow: string; scale: number }> = {
  "NICE!":          { color: "text-emerald-400", dropShadow: "drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]",  scale: 1.35 },
  "GREAT!":         { color: "text-cyan-400",    dropShadow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]",  scale: 1.45 },
  "AMAZING!":       { color: "text-purple-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]", scale: 1.5  },
  "ON FIRE!":       { color: "text-orange-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]",  scale: 1.55 },
  "UNSTOPPABLE!":   { color: "text-amber-400",   dropShadow: "drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]",  scale: 1.6  },
  "MULTIPLIER UP!": { color: "text-main",        dropShadow: "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]",   scale: 1.5  },
};

export interface GameState {
  score: number;
  combo: number;
  multiplier: number;
  lastFeedback: string;
  feedbackId: number;
}

export function getPerformanceGrade(accuracy: number) {
  if (accuracy >= 95) return { letter: "S", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   glow: "shadow-[0_0_12px_rgba(251,191,36,0.4)]" };
  if (accuracy >= 85) return { letter: "A", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "" };
  if (accuracy >= 70) return { letter: "B", color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    glow: "" };
  if (accuracy >= 50) return { letter: "C", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  glow: "" };
  return                      { letter: "D", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     glow: "" };
}

export function getFeedbackForCombo(combo: number): { text: string } | null {
  if (combo >= 25 && combo % 5 === 0) return { text: "UNSTOPPABLE!" };
  if (combo === 20) return { text: "ON FIRE!" };
  if (combo === 15) return { text: "AMAZING!" };
  if (combo === 10) return { text: "GREAT!" };
  if (combo === 5)  return { text: "NICE!" };
  return null;
}
