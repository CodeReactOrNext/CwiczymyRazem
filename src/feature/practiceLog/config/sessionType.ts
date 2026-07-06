import type { LucideIcon } from "lucide-react";
import { ListChecks, Music2, NotebookPen } from "lucide-react";

import type { SessionType } from "../types/practiceLog.types";

export interface SessionTypeConfig {
  icon: LucideIcon;
  labelKey: string;
  /** Full Tailwind class strings (no interpolation — must stay static). */
  badge: string;
  iconTile: string;
  accentBar: string;
}

export const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  manual: {
    icon: NotebookPen,
    labelKey: "card.type_manual",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    iconTile: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    accentBar: "bg-cyan-500",
  },
  plan: {
    icon: ListChecks,
    labelKey: "card.type_plan",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    iconTile: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentBar: "bg-emerald-500",
  },
  song: {
    icon: Music2,
    labelKey: "card.type_song",
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    iconTile: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    accentBar: "bg-violet-500",
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
