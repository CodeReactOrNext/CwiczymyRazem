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
    primary: "text-main",
    bg: "bg-main-900/20",
    border: "border-main",
    shadow: "shadow-main/20",
    glow: "bg-main",
    line: "#0891B2", // main (brand teal)
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
    primary: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-500",
    shadow: "shadow-amber-500/20",
    glow: "bg-amber-500",
    line: "#f59e0b", // amber-500
  },
};

export const getSkillTheme = (category: CategoryKeys) => {
  return SKILL_CATEGORY_THEMES[category] || SKILL_CATEGORY_THEMES.technique;
};
