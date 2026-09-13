// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DashboardLayoutProvider } from "feature/dashboard/context/DashboardContext";
import { SHORTCUTS } from "feature/dashboard/data/shortcutCatalog";
import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import { MAX_SHORTCUTS } from "feature/dashboard/utils/dashboardLayout";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShortcutsWidget } from "./ShortcutsWidget";

const layoutWith = (
  shortcuts: DashboardLayout["shortcuts"],
): DashboardLayout => ({ version: 1, widgets: [], shortcuts });

const renderWidget = (layout: DashboardLayout, isEditing: boolean) => {
  const updateLayout = vi.fn();
  render(
    <DashboardLayoutProvider value={{ layout, isEditing, updateLayout }}>
      <ShortcutsWidget />
    </DashboardLayoutProvider>,
  );
  return updateLayout;
};

describe("ShortcutsWidget", () => {
  afterEach(cleanup);

  it("renders pinned shortcuts as links to their pages, in the order they were picked", () => {
    renderWidget(layoutWith(["settings", "arsenal"]), false);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Settings",
      "Arsenal",
    ]);
    expect(links[0].getAttribute("href")).toBe("/settings");
    expect(links[1].getAttribute("href")).toBe("/arsenal");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says so when nothing is pinned", () => {
    renderWidget(layoutWith([]), false);

    expect(screen.getByText(/No shortcuts pinned yet/)).toBeTruthy();
  });

  it("pins and unpins destinations while Home is being customised", () => {
    const updateLayout = renderWidget(layoutWith(["settings"]), true);

    fireEvent.click(screen.getByRole("button", { name: "Arsenal" }));
    expect(updateLayout).toHaveBeenLastCalledWith(
      expect.objectContaining({ shortcuts: ["settings", "arsenal"] }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(updateLayout).toHaveBeenLastCalledWith(
      expect.objectContaining({ shortcuts: [] }),
    );
  });

  it("marks what is pinned and counts it against the cap", () => {
    renderWidget(layoutWith(["settings"]), true);

    expect(
      screen
        .getByRole("button", { name: "Settings" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Arsenal" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(screen.getByText(`1/${MAX_SHORTCUTS}`)).toBeTruthy();
  });

  it("greys out the rest once the card is full, but still lets a pin come off", () => {
    const full = SHORTCUTS.slice(0, MAX_SHORTCUTS).map((s) => s.id);
    renderWidget(layoutWith(full), true);

    const wiki = screen.getByRole("button", { name: "Knowledge Base" });
    expect((wiki as HTMLButtonElement).disabled).toBe(true);

    const pinned = screen.getByRole("button", { name: SHORTCUTS[0].label });
    expect((pinned as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(`${MAX_SHORTCUTS}/${MAX_SHORTCUTS}`)).toBeTruthy();
  });
});
