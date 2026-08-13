/**
 * The accent each practice category carries across the report form — the time
 * boxes, the saved-time banner and the per-song time rows all read as one
 * family because they use these same colors.
 */
export const SKILL_COLORS = {
  technique: "#e04c3b",
  theory: "#a44aed",
  hearing: "#4a7edd",
  creativity: "#37b874",
} as const;

export type SkillColorKey = keyof typeof SKILL_COLORS;
