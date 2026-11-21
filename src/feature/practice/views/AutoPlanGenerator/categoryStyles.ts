/**
 * One dot colour per exercise category and difficulty. The colour only marks
 * the dot — the label next to it stays neutral, so a row of exercises doesn't
 * turn into a rainbow of badges.
 */
export const CATEGORY_DOT: Record<string, string> = {
  technique: "bg-emerald-400",
  theory: "bg-blue-400",
  creativity: "bg-purple-400",
  hearing: "bg-amber-400",
};

export const DIFFICULTY_DOT: Record<string, string> = {
  beginner: "bg-sky-400",
  easy: "bg-green-400",
  medium: "bg-yellow-400",
  hard: "bg-red-400",
};

export const FALLBACK_DOT = "bg-zinc-500";
