export type MasteryLevel = 0 | 1 | 2 | 3 | 4;
// 0 = Not learned, 1 = Bad, 2 = Medium, 3 = Mastered, 4 = Skip

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: "Not learned",
  1: "Bad",
  2: "Medium",
  3: "Mastered",
  4: "Skip",
};

export const SECTION_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export interface SongSection {
  id: string;
  name: string;
  startTime: number; // seconds
  color: string;
  mastery: MasteryLevel;
}
