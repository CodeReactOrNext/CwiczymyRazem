import type { CategoryKeys } from "components/Charts/ActivityChart";

export type SkillColorTheme = {
  primary: string; // Text/Border/Glow (e.g. text-red-400)
  bg: string; // Background tint (e.g. bg-red-500/10)
  border: string; // Border color (e.g. border-red-500)
  shadow: string; // Box shadow (e.g. shadow-red-500/10)
  glow: string; // Blur/Glow color (e.g. bg-red-500)
  line: string; // SVG Line color
};

export const SKILL_CATEGORY_THEMES: Record<CategoryKeys, SkillColorTheme> = {
  technique: {
    primary: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-500",
    shadow: "shadow-red-500/20",
    glow: "bg-red-500",
    line: "#ef4444", // red-500
  },
  theory: {
    primary: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-500",
    shadow: "shadow-blue-500/20",
    glow: "bg-blue-500",
    line: "#3b82f6", // blue-500
  },
  hearing: {
    primary: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-500",
    shadow: "shadow-emerald-500/20",
    glow: "bg-emerald-500",
    line: "#10b981", // emerald-500
  },
  creativity: {
    primary: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-500",
    shadow: "shadow-purple-500/20",
    glow: "bg-purple-500",
    line: "#a855f7", // purple-500
  },
};

export const getSkillTheme = (category: CategoryKeys) => {
  return SKILL_CATEGORY_THEMES[category] || SKILL_CATEGORY_THEMES.technique;
};
