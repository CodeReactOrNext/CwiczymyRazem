import type { LucideIcon } from "lucide-react";
import { ListChecks, Music2, NotebookPen } from "lucide-react";

import type { SessionType } from "../types/practiceLog.types";

export interface SessionTypeConfig {
  icon: LucideIcon;
  labelKey: string;
  /**
   * Icon-tile classes copied 1:1 from the /timer ModeCard style
   * (gradient fill + tinted top/left border + colored glyph).
   * Must stay static strings — no Tailwind interpolation.
   */
  iconBg: string;
  iconBorder: string;
  iconText: string;
  /** Solid accent for timeline markers & the day-timeline card badge. */
  accentSolid: string;
  accentText: string;
  accentBorder: string;
}

export const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  manual: {
    icon: NotebookPen,
    labelKey: "card.type_manual",
    iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-500/5",
    iconBorder:
      "border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20",
    iconText: "text-cyan-400",
    accentSolid: "bg-cyan-500",
    accentText: "text-zinc-950",
    accentBorder: "border-cyan-400/60",
  },
  plan: {
    icon: ListChecks,
    labelKey: "card.type_plan",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconBorder:
      "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20",
    iconText: "text-emerald-400",
    accentSolid: "bg-emerald-500",
    accentText: "text-zinc-950",
    accentBorder: "border-emerald-400/60",
  },
  song: {
    icon: Music2,
    labelKey: "card.type_song",
    iconBg: "bg-gradient-to-br from-violet-500/20 to-violet-500/5",
    iconBorder:
      "border border-white/5 border-t-violet-500/40 border-l-violet-500/20",
    iconText: "text-violet-400",
    accentSolid: "bg-violet-500",
    accentText: "text-zinc-50",
    accentBorder: "border-violet-400/60",
  },
};

export const CATEGORY_META: {
  key: "techniqueTime" | "theoryTime" | "hearingTime" | "creativityTime";
  labelKey: string;
  text: string;
  dot: string;
}[] = [
  { key: "techniqueTime", labelKey: "common:calendar.technique", text: "text-blue-400", dot: "bg-blue-400" },
  { key: "theoryTime", labelKey: "common:calendar.theory", text: "text-violet-400", dot: "bg-violet-400" },
  { key: "hearingTime", labelKey: "common:calendar.hearing", text: "text-cyan-400", dot: "bg-cyan-400" },
  { key: "creativityTime", labelKey: "common:calendar.creativity", text: "text-green-400", dot: "bg-green-400" },
];
