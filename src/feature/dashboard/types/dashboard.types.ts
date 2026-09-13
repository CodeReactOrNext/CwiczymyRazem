import type { ShortcutId } from "feature/dashboard/data/shortcutCatalog";

/**
 * Every fixed card the player can arrange. The order here is only the registry
 * order — what a player actually sees comes from their saved `DashboardLayout`.
 *
 * Two kinds of card are missing from this list. The individual milestone cards
 * are generated from the tier table instead (see `MilestoneWidgetId`), so a new
 * tier becomes an addable card on its own. And three parts of Home are not
 * cards at all: the getting-started checklist above them, and the support
 * banner and community feed below. Those always sit in the same place and
 * cannot be moved or hidden.
 */
export const WIDGET_IDS = [
  "daily-quests",
  "practice-stats",
  "streak",
  "shortcuts",
  "recent-sessions",
  "activity-log",
  "level-rewards",
  "songs",
  "rank",
  "monthly-challenge",
  "community-goal",
] as const;

export type StaticWidgetId = (typeof WIDGET_IDS)[number];

/**
 * One weekly practice goal on its own card — `milestone-3` is the third tier.
 * Only tier numbers that exist count as widgets; see `isWidgetId`.
 */
export type MilestoneWidgetId = `milestone-${number}`;

export type WidgetId = StaticWidgetId | MilestoneWidgetId;

/** Half = one column of the two-column desktop grid; full = both. Phones stack everything. */
export type WidgetSize = "half" | "full";

export type WidgetGroup = "practice" | "progress" | "milestones" | "community";

export interface WidgetPlacement {
  id: WidgetId;
  size: WidgetSize;
}

export interface DashboardLayout {
  version: 1;
  /** Visible cards, top to bottom. Anything not listed is hidden. */
  widgets: WidgetPlacement[];
  /** Destinations pinned to the Shortcuts card, in the order they were picked. */
  shortcuts: ShortcutId[];
}
