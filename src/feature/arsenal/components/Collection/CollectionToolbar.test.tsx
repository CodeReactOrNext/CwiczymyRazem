import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CollectionToolbar } from "./CollectionToolbar";

afterEach(cleanup);

const renderToolbar = (overrides = {}) => {
  const props = {
    scope: "all" as const,
    onScopeChange: vi.fn(),
    sort: "rarity" as const,
    onSortChange: vi.fn(),
    query: "",
    onQueryChange: vi.fn(),
    view: "stash" as const,
    onViewChange: vi.fn(),
    guitarCount: 13,
    pedalCount: 19,
    ...overrides,
  };
  render(<CollectionToolbar {...props} />);
  return props;
};

describe("CollectionToolbar", () => {
  it("counts guitars and pedals together under All", () => {
    renderToolbar();
    expect(screen.getByText("32")).toBeTruthy();
    expect(screen.getByText("13")).toBeTruthy();
    expect(screen.getByText("19")).toBeTruthy();
  });

  it("marks the active scope and sort as pressed", () => {
    renderToolbar({ scope: "pedals", sort: "newest" });
    expect(screen.getByText("Pedals").closest("button")?.ariaPressed).toBe(
      "true",
    );
    expect(screen.getByText("Guitars").closest("button")?.ariaPressed).toBe(
      "false",
    );
    expect(screen.getByText("Newest").closest("button")?.ariaPressed).toBe(
      "true",
    );
  });

  it("marks the active view as pressed and reports the switch", () => {
    const props = renderToolbar();
    expect(screen.getByLabelText("Stash view").ariaPressed).toBe("true");
    expect(screen.getByLabelText("Cards view").ariaPressed).toBe("false");

    fireEvent.click(screen.getByLabelText("Cards view"));
    expect(props.onViewChange).toHaveBeenCalledWith("cards");
  });

  it("drops the view switch where there is only one view to have", () => {
    renderToolbar({ view: "cards", showViewSwitch: false });
    expect(screen.queryByLabelText("Stash view")).toBeNull();
    expect(screen.queryByLabelText("Cards view")).toBeNull();
    // The rest of the bar is untouched: a phone still filters and searches.
    expect(screen.getByText("Rarity")).toBeTruthy();
    expect(screen.getByLabelText("Search your collection")).toBeTruthy();
  });

  it("reports scope, sort and query changes", () => {
    const props = renderToolbar();

    fireEvent.click(screen.getByText("Guitars"));
    expect(props.onScopeChange).toHaveBeenCalledWith("guitars");

    fireEvent.click(screen.getByText("Level"));
    expect(props.onSortChange).toHaveBeenCalledWith("level");

    fireEvent.change(screen.getByLabelText("Search your collection"), {
      target: { value: "strat" },
    });
    expect(props.onQueryChange).toHaveBeenCalledWith("strat");
  });
});
