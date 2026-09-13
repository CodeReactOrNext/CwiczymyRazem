import { LEVELS } from "feature/aiSummary/utils/milestoneLogic";
import {
  MILESTONE_WIDGET_IDS,
  milestoneWidgetId,
} from "feature/dashboard/data/milestoneWidgets";
import { SHORTCUTS } from "feature/dashboard/data/shortcutCatalog";
import {
  getWidgetDefinition,
  isWidgetId,
  WIDGET_CATALOG,
} from "feature/dashboard/data/widgetCatalog";
import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import { WIDGET_IDS } from "feature/dashboard/types/dashboard.types";
import { describe, expect, it } from "vitest";

import {
  addWidget,
  DEFAULT_LAYOUT,
  hiddenWidgets,
  isDefaultLayout,
  MAX_SHORTCUTS,
  moveWidget,
  normalizeLayout,
  removeWidget,
  setWidgetSize,
  toggleShortcut,
} from "./dashboardLayout";

const layoutWith = (
  widgets: DashboardLayout["widgets"],
  shortcuts: DashboardLayout["shortcuts"] = [],
): DashboardLayout => ({ version: 1, widgets, shortcuts });

describe("widget catalog", () => {
  it("lists the fixed cards first, then one card per milestone tier", () => {
    expect(WIDGET_CATALOG.map((w) => w.id)).toEqual([
      ...WIDGET_IDS,
      ...MILESTONE_WIDGET_IDS,
    ]);
  });

  it("has no duplicate ids across fixed and milestone cards", () => {
    const ids = WIDGET_CATALOG.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names every milestone card after its tier and files it under weekly goals", () => {
    LEVELS.forEach((tier) => {
      const definition = getWidgetDefinition(milestoneWidgetId(tier.id));
      expect(definition.title).toBe(tier.name);
      expect(definition.group).toBe("milestones");
      expect(definition.icon).toBe(tier.Icon);
      expect(definition.description).toContain(tier.req);
    });
  });

  it("accepts only milestone ids that name a real tier", () => {
    expect(isWidgetId(milestoneWidgetId(LEVELS[0].id))).toBe(true);
    expect(isWidgetId(`milestone-${LEVELS.length + 1}`)).toBe(false);
    // Spellings that would let one tier own two different ids.
    expect(isWidgetId("milestone-01")).toBe(false);
    expect(isWidgetId("milestone-1.0")).toBe(false);
    expect(isWidgetId("milestone-")).toBe(false);
    expect(isWidgetId("milestone-x")).toBe(false);
  });

  it("only offers half width where the catalog says the card can shrink", () => {
    WIDGET_CATALOG.forEach((definition) => {
      if (!definition.resizable) expect(definition.defaultSize).toBe("full");
    });
  });

  it("has unique shortcut ids and hrefs", () => {
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length);
    expect(new Set(SHORTCUTS.map((s) => s.href)).size).toBe(SHORTCUTS.length);
  });

  it("ships a default layout made only of known cards and shortcuts", () => {
    expect(normalizeLayout(DEFAULT_LAYOUT)).toEqual(DEFAULT_LAYOUT);
    expect(isDefaultLayout(DEFAULT_LAYOUT)).toBe(true);
  });
});

describe("normalizeLayout", () => {
  it("falls back to the default when nothing is stored", () => {
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout("nope")).toEqual(DEFAULT_LAYOUT);
  });

  it("returns fresh arrays rather than aliasing the default", () => {
    const layout = normalizeLayout(undefined);
    layout.widgets.push({ id: "streak", size: "half" });
    expect(DEFAULT_LAYOUT.widgets).toHaveLength(3);
  });

  it("drops cards an older layout still lists but the app has since retired", () => {
    // The checklist, support banner and community feed are pinned outside the
    // layout now, and the combined milestones card was replaced by one card per
    // tier. None of them may come back as an arrangeable card.
    const layout = normalizeLayout({
      widgets: [
        { id: "getting-started", size: "full" },
        { id: "daily-quests", size: "half" },
        { id: "milestones", size: "half" },
        { id: "support", size: "full" },
        { id: "community-feed", size: "full" },
      ],
    });
    expect(layout.widgets).toEqual([{ id: "daily-quests", size: "half" }]);
  });

  it("drops cards the app no longer has and collapses duplicates", () => {
    const layout = normalizeLayout({
      widgets: [
        { id: "streak", size: "half" },
        { id: "retired-widget", size: "half" },
        { id: "streak", size: "full" },
        "rank",
      ],
      shortcuts: [],
    });
    expect(layout.widgets).toEqual([
      { id: "streak", size: "half" },
      { id: "rank", size: "half" },
    ]);
  });

  it("repairs bad sizes and forces full width on cards that cannot shrink", () => {
    const layout = normalizeLayout({
      widgets: [
        { id: "daily-quests", size: "huge" },
        { id: "activity-log", size: "half" },
      ],
    });
    expect(layout.widgets).toEqual([
      { id: "daily-quests", size: "half" },
      { id: "activity-log", size: "full" },
    ]);
  });

  it("keeps an emptied list empty — hiding everything is a choice, not a missing field", () => {
    expect(normalizeLayout({ widgets: [] }).widgets).toEqual([]);
    expect(normalizeLayout({}).widgets).toEqual(DEFAULT_LAYOUT.widgets);
  });

  it("filters, dedupes and caps shortcuts", () => {
    const tooMany = SHORTCUTS.map((s) => s.id);
    const layout = normalizeLayout({
      shortcuts: ["settings", "not-a-page", "settings", ...tooMany],
    });
    expect(layout.shortcuts[0]).toBe("settings");
    expect(layout.shortcuts).toHaveLength(MAX_SHORTCUTS);
    expect(new Set(layout.shortcuts).size).toBe(MAX_SHORTCUTS);
  });
});

describe("editing", () => {
  it("adds a card at the bottom in its default size, once", () => {
    const layout = layoutWith([{ id: "daily-quests", size: "half" }]);
    const added = addWidget(layout, "activity-log");
    expect(added.widgets).toEqual([
      { id: "daily-quests", size: "half" },
      { id: "activity-log", size: "full" },
    ]);
    expect(addWidget(added, "activity-log")).toBe(added);
  });

  it("removes a card and leaves the rest in order", () => {
    const layout = layoutWith([
      { id: "daily-quests", size: "half" },
      { id: "streak", size: "half" },
      { id: "rank", size: "half" },
    ]);
    expect(removeWidget(layout, "streak").widgets.map((w) => w.id)).toEqual([
      "daily-quests",
      "rank",
    ]);
  });

  it("moves a card to a new position", () => {
    const layout = layoutWith([
      { id: "daily-quests", size: "half" },
      { id: "streak", size: "half" },
      { id: "rank", size: "half" },
    ]);
    expect(moveWidget(layout, 0, 2).widgets.map((w) => w.id)).toEqual([
      "streak",
      "rank",
      "daily-quests",
    ]);
    expect(moveWidget(layout, 2, 0).widgets.map((w) => w.id)).toEqual([
      "rank",
      "daily-quests",
      "streak",
    ]);
  });

  it("ignores moves that point outside the list", () => {
    const layout = layoutWith([{ id: "daily-quests", size: "half" }]);
    expect(moveWidget(layout, 0, 5)).toBe(layout);
    expect(moveWidget(layout, -1, 0)).toBe(layout);
    expect(moveWidget(layout, 0, 0)).toBe(layout);
  });

  it("resizes only cards that are allowed to shrink", () => {
    const layout = layoutWith([
      { id: "daily-quests", size: "half" },
      { id: "activity-log", size: "full" },
    ]);
    expect(setWidgetSize(layout, "daily-quests", "full").widgets[0].size).toBe(
      "full",
    );
    expect(setWidgetSize(layout, "activity-log", "half")).toBe(layout);
  });

  it("toggles shortcuts and refuses to go past the cap", () => {
    let layout = layoutWith([], ["settings"]);
    layout = toggleShortcut(layout, "arsenal");
    expect(layout.shortcuts).toEqual(["settings", "arsenal"]);
    layout = toggleShortcut(layout, "settings");
    expect(layout.shortcuts).toEqual(["arsenal"]);

    const full = layoutWith(
      [],
      SHORTCUTS.slice(0, MAX_SHORTCUTS).map((s) => s.id),
    );
    expect(toggleShortcut(full, "wiki")).toBe(full);
    expect(toggleShortcut(full, full.shortcuts[0]).shortcuts).toHaveLength(
      MAX_SHORTCUTS - 1,
    );
  });

  it("lists exactly the cards that are not on Home, milestone tiers included", () => {
    const hidden = hiddenWidgets(DEFAULT_LAYOUT).map((w) => w.id);
    expect(hidden).not.toContain("daily-quests");
    expect(hidden).toContain("streak");
    expect(hidden).toContain(milestoneWidgetId(LEVELS[0].id));
    expect(hidden.length + DEFAULT_LAYOUT.widgets.length).toBe(
      WIDGET_CATALOG.length,
    );
  });

  it("adds, moves and hides a single milestone tier like any other card", () => {
    const spark = milestoneWidgetId(LEVELS[0].id);
    const groove = milestoneWidgetId(LEVELS[1].id);

    let layout = addWidget(layoutWith([{ id: "streak", size: "half" }]), spark);
    layout = addWidget(layout, groove);
    expect(layout.widgets).toEqual([
      { id: "streak", size: "half" },
      { id: spark, size: "half" },
      { id: groove, size: "half" },
    ]);

    expect(setWidgetSize(layout, spark, "full").widgets[1].size).toBe("full");
    expect(moveWidget(layout, 2, 0).widgets.map((w) => w.id)).toEqual([
      groove,
      "streak",
      spark,
    ]);
    expect(removeWidget(layout, spark).widgets.map((w) => w.id)).toEqual([
      "streak",
      groove,
    ]);
  });

  it("drops a saved milestone card whose tier no longer exists", () => {
    const layout = normalizeLayout({
      widgets: [
        { id: milestoneWidgetId(LEVELS[0].id), size: "half" },
        { id: `milestone-${LEVELS.length + 5}`, size: "half" },
      ],
    });
    expect(layout.widgets).toEqual([
      { id: milestoneWidgetId(LEVELS[0].id), size: "half" },
    ]);
  });

  it("recognises the default layout only when order, size and shortcuts all match", () => {
    expect(isDefaultLayout(normalizeLayout(undefined))).toBe(true);
    expect(isDefaultLayout(moveWidget(DEFAULT_LAYOUT, 1, 2))).toBe(false);
    expect(
      isDefaultLayout(setWidgetSize(DEFAULT_LAYOUT, "daily-quests", "full")),
    ).toBe(false);
    expect(isDefaultLayout(toggleShortcut(DEFAULT_LAYOUT, "wiki"))).toBe(false);
  });
});
