// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SkillRoadmapMobile } from "./SkillRoadmapMobile";

const renderRoadmap = (
  overrides: Partial<Parameters<typeof SkillRoadmapMobile>[0]> = {},
) => {
  const onStartExercise = vi.fn();
  const onShowUpgrade = vi.fn();
  render(
    <SkillRoadmapMobile
      progressMap={new Map()}
      skillLevels={{}}
      isPremium
      onStartExercise={onStartExercise}
      onShowUpgrade={onShowUpgrade}
      {...overrides}
    />,
  );
  return { onStartExercise, onShowUpgrade };
};

describe("SkillRoadmapMobile", () => {
  afterEach(cleanup);

  it("opens on the whole path, with every branch collapsed", () => {
    renderRoadmap();

    const branches = screen.getAllByRole("button", { expanded: false });
    expect(branches.length).toBeGreaterThan(10);
    expect(screen.queryByRole("button", { expanded: true })).toBeNull();
  });

  it("names the next exercise and starts it from the top of the page", () => {
    const { onStartExercise } = renderRoadmap();

    // The branch holding it is flagged too, so "Up next" appears more than once.
    expect(screen.getAllByText("Up next").length).toBeGreaterThan(1);
    expect(screen.getByText(/Foundations · Getting Started/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ }));

    expect(onStartExercise).toHaveBeenCalledTimes(1);
    // The session is handed a one-exercise plan, the same shape a list start uses.
    expect(onStartExercise.mock.calls[0][0].exercises).toHaveLength(1);
  });

  it("opens a branch in place and closes it again on a second tap", () => {
    renderRoadmap();
    const branch = screen.getByRole("button", { name: /Getting Started/ });

    fireEvent.click(branch);
    expect(branch.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(
      branch.getAttribute("aria-controls") as string,
    ) as HTMLElement;
    expect(within(panel).getAllByRole("listitem").length).toBeGreaterThan(0);

    fireEvent.click(branch);
    expect(branch.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps only one branch open at a time, so the page stays short", () => {
    renderRoadmap();

    fireEvent.click(screen.getByRole("button", { name: /Getting Started/ }));
    fireEvent.click(screen.getByRole("button", { name: /Play-alongs/ }));

    const open = screen.getAllByRole("button", { expanded: true });
    expect(open).toHaveLength(1);
    expect(open[0].textContent).toContain("Play-alongs");
  });

  it("gives every tier a jump target and a heading", () => {
    renderRoadmap();

    const jumps = within(
      screen.getByRole("navigation", { name: "Jump to a tier" }),
    ).getAllByRole("button");
    expect(jumps.length).toBeGreaterThan(1);

    jumps.forEach((jump) => {
      const title = jump.textContent?.replace(/[\d/]/g, "").trim();
      expect(
        screen.getAllByRole("heading", { name: new RegExp(title as string) })
          .length,
      ).toBeGreaterThan(0);
    });
  });
});
