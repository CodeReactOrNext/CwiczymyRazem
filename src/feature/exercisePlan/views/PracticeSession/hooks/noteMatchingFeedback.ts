export interface GameState {
  score: number;
  combo: number;
  multiplier: number;
}

export function getPerformanceGrade(accuracy: number) {
  if (accuracy >= 95) return { letter: "S", color: "text-amber-400",   bg: "bg-amber-500/10",   glow: "shadow-[0_0_12px_rgba(251,191,36,0.4)]" };
  if (accuracy >= 85) return { letter: "A", color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "" };
  if (accuracy >= 70) return { letter: "B", color: "text-cyan-400",    bg: "bg-cyan-500/10",    glow: "" };
  if (accuracy >= 50) return { letter: "C", color: "text-orange-400",  bg: "bg-orange-500/10",  glow: "" };
  return                      { letter: "D", color: "text-red-400",     bg: "bg-red-500/10",     glow: "" };
}
