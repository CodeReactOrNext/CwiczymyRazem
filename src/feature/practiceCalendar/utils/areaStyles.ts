import type { PracticeArea } from "../types/calendar.types";

/**
 * One colour per practice area, used only where the area is the information:
 * the dot on a slot, the balance bar, the preview columns.
 */
export const AREA_DOT: Record<PracticeArea, string> = {
  technique: "bg-cyan-400",
  songs: "bg-orange-400",
  theory: "bg-violet-400",
  hearing: "bg-amber-300",
  creativity: "bg-emerald-400",
};
