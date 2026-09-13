import type { ShortcutId } from "feature/dashboard/data/shortcutCatalog";
import { isShortcutId } from "feature/dashboard/data/shortcutCatalog";
import type { WidgetDefinition } from "feature/dashboard/data/widgetCatalog";
import {
  getWidgetDefinition,
  isWidgetId,
  WIDGET_CATALOG,
} from "feature/dashboard/data/widgetCatalog";
import type {
  DashboardLayout,
  WidgetId,
  WidgetPlacement,
  WidgetSize,
} from "feature/dashboard/types/dashboard.types";

/** How many quick links the Shortcuts card holds before it stops being quick. */
export const MAX_SHORTCUTS = 8;

/**
 * What the arrangeable part of Home looked like before it could be customised
 * — so an account that has never touched the layout sees exactly the page it
 * always did. The checklist above and the banner and feed below are fixed and
 * not part of the layout at all.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  widgets: [
    { id: "daily-quests", size: "half" },
    { id: "practice-stats", size: "half" },
    { id: "activity-log", size: "full" },
  ],
  shortcuts: [
    "practice-plans",
    "practice-auto",
    "songs-board",
    "practice-report",
  ],
};

const isWidgetSize = (value: unknown): value is WidgetSize =>
  value === "half" || value === "full";

/** The size a card is allowed to have: non-resizable cards are always full width. */
const clampSize = (id: WidgetId, size: WidgetSize): WidgetSize =>
  getWidgetDefinition(id).resizable ? size : "full";

const normalizeWidgets = (raw: unknown): WidgetPlacement[] => {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT.widgets.map((w) => ({ ...w }));

  const seen = new Set<WidgetId>();
  const widgets: WidgetPlacement[] = [];
  raw.forEach((entry) => {
    const id = typeof entry === "string" ? entry : entry?.id;
    if (!isWidgetId(id) || seen.has(id)) return;
    seen.add(id);
    const size = isWidgetSize(entry?.size)
      ? entry.size
      : getWidgetDefinition(id).defaultSize;
    widgets.push({ id, size: clampSize(id, size) });
  });
  return widgets;
};

const normalizeShortcuts = (raw: unknown): ShortcutId[] => {
  if (!Array.isArray(raw)) return [...DEFAULT_LAYOUT.shortcuts];
  const seen = new Set<ShortcutId>();
  raw.forEach((entry) => {
    if (isShortcutId(entry)) seen.add(entry);
  });
  return Array.from(seen).slice(0, MAX_SHORTCUTS);
};

/**
 * Turns whatever is stored into a layout the page can render: unknown cards
 * (removed from the app since) are dropped, duplicates collapse to their first
 * occurrence, bad sizes fall back to the card's default, and a missing list
 * means "never customised" rather than "hid everything".
 */
export const normalizeLayout = (raw: unknown): DashboardLayout => {
  if (!raw || typeof raw !== "object") {
    return {
      version: 1,
      widgets: DEFAULT_LAYOUT.widgets.map((w) => ({ ...w })),
      shortcuts: [...DEFAULT_LAYOUT.shortcuts],
    };
  }
  const data = raw as Record<string, unknown>;
  return {
    version: 1,
    widgets: normalizeWidgets(data.widgets),
    shortcuts: normalizeShortcuts(data.shortcuts),
  };
};

export const hasWidget = (layout: DashboardLayout, id: WidgetId): boolean =>
  layout.widgets.some((w) => w.id === id);

/** Appends the card at the bottom in its default size; a no-op when it is already shown. */
export const addWidget = (
  layout: DashboardLayout,
  id: WidgetId,
): DashboardLayout => {
  if (hasWidget(layout, id)) return layout;
  return {
    ...layout,
    widgets: [
      ...layout.widgets,
      { id, size: getWidgetDefinition(id).defaultSize },
    ],
  };
};

export const removeWidget = (
  layout: DashboardLayout,
  id: WidgetId,
): DashboardLayout => ({
  ...layout,
  widgets: layout.widgets.filter((w) => w.id !== id),
});

/** Moves the card at `from` so it lands at `to`; out-of-range indexes leave the layout alone. */
export const moveWidget = (
  layout: DashboardLayout,
  from: number,
  to: number,
): DashboardLayout => {
  const { widgets } = layout;
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= widgets.length ||
    to >= widgets.length
  ) {
    return layout;
  }
  const next = [...widgets];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { ...layout, widgets: next };
};

export const setWidgetSize = (
  layout: DashboardLayout,
  id: WidgetId,
  size: WidgetSize,
): DashboardLayout => {
  if (!getWidgetDefinition(id).resizable) return layout;
  return {
    ...layout,
    widgets: layout.widgets.map((w) => (w.id === id ? { ...w, size } : w)),
  };
};

export const isShortcutLimitReached = (layout: DashboardLayout): boolean =>
  layout.shortcuts.length >= MAX_SHORTCUTS;

/**
 * Pins or unpins a destination. Adding past the limit leaves the layout as it
 * was, so the picker can show the cap instead of silently dropping a pick.
 */
export const toggleShortcut = (
  layout: DashboardLayout,
  id: ShortcutId,
): DashboardLayout => {
  if (layout.shortcuts.includes(id)) {
    return { ...layout, shortcuts: layout.shortcuts.filter((s) => s !== id) };
  }
  if (isShortcutLimitReached(layout)) return layout;
  return { ...layout, shortcuts: [...layout.shortcuts, id] };
};

/** Cards that are not on Home right now, in registry order — the "Add" list. */
export const hiddenWidgets = (layout: DashboardLayout): WidgetDefinition[] =>
  WIDGET_CATALOG.filter((definition) => !hasWidget(layout, definition.id));

export const isDefaultLayout = (layout: DashboardLayout): boolean =>
  layout.widgets.length === DEFAULT_LAYOUT.widgets.length &&
  layout.widgets.every(
    (w, i) =>
      w.id === DEFAULT_LAYOUT.widgets[i].id &&
      w.size === DEFAULT_LAYOUT.widgets[i].size,
  ) &&
  layout.shortcuts.length === DEFAULT_LAYOUT.shortcuts.length &&
  layout.shortcuts.every((s, i) => s === DEFAULT_LAYOUT.shortcuts[i]);
