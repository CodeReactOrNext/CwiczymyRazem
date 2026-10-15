import { Brain, Ear,Hand, Lightbulb } from "lucide-react";
import type { IconType } from "react-icons/lib";
import type { SkillsType } from "types/skillsTypes";

/**
 * The one icon per practice category, used everywhere a category is shown —
 * Free Timer, Manual Log, song sessions. Different screens used to pick their
 * own (a graduation cap for theory here, a brain there), so the same category
 * looked like two different things.
 */
export const SKILL_CATEGORY_ICONS: Record<SkillsType, IconType> = {
  technique: Hand,
  theory: Brain,
  hearing: Ear,
  creativity: Lightbulb,
};
