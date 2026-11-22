// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CollectionToolbar } from "./CollectionToolbar";

afterEach(cleanup);

const renderToolbar = (overrides = {}) => {
  const props = {
    scope: "guitars" as const,
    onScopeChange: vi.fn(),
    counts: { guitars: 13, pedals: 19, parts: 7, builder: 4 },
    sort: "rarity" as const,
    onSortChange: vi.fn(),
    query: "",
    onQueryChange: vi.fn(),
    view: "stash" as const,
    onViewChange: vi.fn(),
    ...overrides,
  };
  render(<CollectionToolbar {...props} />);
  return props;
};

const shelf = (name: RegExp) => screen.getByRole("button", { name });
const key = (name: RegExp) => screen.getByRole("button", { name });

describe("CollectionToolbar", () => {
  it("shows every shelf with how much it holds", () => {
    renderToolbar();
    expect(shelf(/Guitars/).textContent).toContain("13");
    expect(shelf(/Pedals/).textContent).toContain("19");
    expect(shelf(/Parts/).textContent).toContain("7");
    expect(shelf(/Builder/).textContent).toContain("4");
  });

  it("marks the active shelf as pressed and shows the active sort", () => {
    renderToolbar({ scope: "pedals", sort: "newest" });
    expect(shelf(/Pedals/).getAttribute("aria-pressed")).toBe("true");
    expect(shelf(/Guitars/).getAttribute("aria-pressed")).toBe("false");
    expect(
      screen.getByRole("combobox", { name: "Sort by" }).textContent,
    ).toContain("Newest");
  });

  it("marks the active view as pressed and reports the switch", () => {
    const props = renderToolbar();
    expect(key(/Stash view/).getAttribute("aria-pressed")).toBe("true");
    expect(key(/Cards view/).getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(key(/Cards view/));
    expect(props.onViewChange).toHaveBeenCalledWith("cards");
  });

  it("drops the view switch where there is only one view to have", () => {
    renderToolbar({ view: "cards", showViewSwitch: false });
    expect(screen.queryByRole("button", { name: /Stash view/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Cards view/ })).toBeNull();
    // The rest of the bar is untouched: a phone still sorts and searches.
    expect(screen.getByRole("combobox", { name: "Sort by" })).toBeTruthy();
    expect(screen.getByLabelText("Search your collection")).toBeTruthy();
  });

  it("drops the sort where there is nothing to order by", () => {
    renderToolbar({ showSort: false });
    expect(screen.queryByRole("combobox", { name: "Sort by" })).toBeNull();
  });

  it("reports shelf and query changes", () => {
    const props = renderToolbar();

    fireEvent.click(shelf(/Parts/));
    expect(props.onScopeChange).toHaveBeenCalledWith("parts");

    fireEvent.change(screen.getByLabelText("Search your collection"), {
      target: { value: "strat" },
    });
    expect(props.onQueryChange).toHaveBeenCalledWith("strat");
  });

  it("puts the shelf's own keys at the end of the bar", () => {
    renderToolbar({ actions: <button type='button'>Tidy up</button> });
    expect(screen.getByRole("button", { name: "Tidy up" })).toBeTruthy();
  });
});
