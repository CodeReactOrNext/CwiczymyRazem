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

export type AccuracyDisplay =
  | { kind: "value"; text: string; color: string; grade: ReturnType<typeof getPerformanceGrade> }
  | { kind: "idle" | "silent"; text: string; color: string; hint: string };

/**
 * What the HUD shows for accuracy. Before the first judged note there is no
 * accuracy yet (the raw value defaults to 100%), and misses without a single
 * hit almost always mean the mic isn't picking the guitar up — a red 0% there
 * reads as "you played badly". `stats` is null for hunts, which score themselves.
 */
export function getAccuracyDisplay(
  accuracy: number,
  stats: { hits: number; misses: number } | null,
): AccuracyDisplay {
  if (stats && stats.hits + stats.misses === 0) {
    return { kind: "idle", text: "—", color: "text-zinc-500", hint: "Accuracy appears after your first note" };
  }
  if (stats && stats.hits === 0) {
    return { kind: "silent", text: "No notes heard", color: "text-zinc-400", hint: "Pitch Detect hasn't matched a note yet — check that the mic hears your guitar" };
  }
  const grade = getPerformanceGrade(accuracy);
  return { kind: "value", text: `${accuracy}%`, color: grade.color, grade };
}
