import type { LucideIcon } from "lucide-react";
import { CassetteTape, ListChecks, NotebookPen } from "lucide-react";

import type { SessionType } from "../types/practiceLog.types";

export interface SessionTypeConfig {
  /**
   * The glyph alone tells the types apart — the list tile itself is the same
   * neutral square the /timer hub and the feed use, so the session rows read
   * as part of the app instead of three loud colors next to the category dots.
   * Same icons as the hub's entries (plans → ListChecks, songs → CassetteTape).
   */
  icon: LucideIcon;
  labelKey: string;
  /** Solid accent for timeline markers & the day-timeline card badge. */
  accentSolid: string;
  accentText: string;
  accentBorder: string;
}

export const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  manual: {
    icon: NotebookPen,
    labelKey: "card.type_manual",
    accentSolid: "bg-cyan-500",
    accentText: "text-zinc-950",
    accentBorder: "border-cyan-400/60",
  },
  plan: {
    icon: ListChecks,
    labelKey: "card.type_plan",
    accentSolid: "bg-emerald-500",
    accentText: "text-zinc-950",
    accentBorder: "border-emerald-400/60",
  },
  song: {
    icon: CassetteTape,
    labelKey: "card.type_song",
    accentSolid: "bg-violet-500",
    accentText: "text-zinc-50",
    accentBorder: "border-violet-400/60",
  },
};

/** Same hues as the category chips (exercisePlan/constants/categoryChip). */
export const CATEGORY_META: {
  key: "techniqueTime" | "theoryTime" | "hearingTime" | "creativityTime";
  labelKey: string;
  text: string;
  dot: string;
}[] = [
  { key: "techniqueTime", labelKey: "common:calendar.technique", text: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "theoryTime", labelKey: "common:calendar.theory", text: "text-blue-400", dot: "bg-blue-400" },
  { key: "hearingTime", labelKey: "common:calendar.hearing", text: "text-amber-400", dot: "bg-amber-400" },
  { key: "creativityTime", labelKey: "common:calendar.creativity", text: "text-purple-400", dot: "bg-purple-400" },
];
