// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { value: "all", label: "All", count: 45 },
  { value: "technique", label: "Technique", count: 36 },
  { value: "theory", label: "Theory", count: 4 },
];

describe("SegmentedControl", () => {
  afterEach(cleanup);

  it("is a named group with the picked segment pressed", () => {
    render(
      <SegmentedControl
        label='Category'
        options={OPTIONS}
        selected={["technique"]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("group", { name: "Category" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Technique/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /All/ }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("shows how many items each choice leaves", () => {
    render(
      <SegmentedControl
        label='Category'
        options={OPTIONS}
        selected={["all"]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Theory 4" })).toBeTruthy();
  });

  it("reports the segment that was picked", () => {
    const onSelect = vi.fn();
    render(
      <SegmentedControl
        label='Category'
        options={OPTIONS}
        selected={["all"]}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Theory/ }));
    expect(onSelect).toHaveBeenCalledWith("theory");
  });

  it("spins in the segment that was clicked while the list loads", () => {
    const props = {
      label: "Category",
      options: OPTIONS,
      selected: ["all"],
      onSelect: vi.fn(),
    };
    const { container, rerender } = render(<SegmentedControl {...props} />);
    const spinners = () => container.querySelectorAll(".animate-spin");

    // Loading that no click here started (the first fetch) shows nothing.
    rerender(<SegmentedControl {...props} isLoading />);
    expect(spinners()).toHaveLength(0);

    rerender(<SegmentedControl {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Theory/ }));
    rerender(<SegmentedControl {...props} isLoading />);

    expect(spinners()).toHaveLength(1);
    expect(
      screen
        .getByRole("button", { name: /Theory/ })
        .querySelector(".animate-spin"),
    ).not.toBeNull();
    expect(
      screen.getByRole("group", { name: "Category" }).getAttribute("aria-busy"),
    ).toBe("true");

    rerender(<SegmentedControl {...props} />);
    expect(spinners()).toHaveLength(0);
  });

  it("can have several segments on at once", () => {
    render(
      <SegmentedControl
        label='Tier'
        multiple
        options={[
          { value: "S", label: "S-Tier", accent: "#f59e0b" },
          { value: "A", label: "A-Tier", accent: "#f97316" },
          { value: "B", label: "B-Tier", accent: "#a855f7" },
        ]}
        selected={["S", "B"]}
        onSelect={vi.fn()}
      />,
    );

    const pressed = screen
      .getAllByRole("button")
      .filter((segment) => segment.getAttribute("aria-pressed") === "true");
    expect(pressed.map((segment) => segment.textContent)).toEqual([
      "S-Tier",
      "B-Tier",
    ]);
  });
});
