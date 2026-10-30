// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BulkDuplicatesDialog } from "./BulkDuplicatesDialog";

afterEach(cleanup);

const items = [
  {
    id: "a",
    name: "Fairmont S-Contour",
    rarity: "Epic" as const,
    level: 24,
    value: 90,
  },
  {
    id: "b",
    name: "Fairmont Tidecaster",
    rarity: "Rare" as const,
    level: 18,
    value: 60,
  },
];

const renderDialog = (
  props: Partial<React.ComponentProps<typeof BulkDuplicatesDialog>> = {},
) => {
  const handlers = {
    onSell: vi.fn(),
    onScrap: vi.fn(),
    onMerge: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <BulkDuplicatesDialog
      isOpen
      items={items}
      fameReward={150}
      scrapParts={[{ partId: "body", tier: "Standard", qty: 4 }]}
      isSelling={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("BulkDuplicatesDialog merge option", () => {
  it("offers to merge the batch, naming how many and how many levels", () => {
    renderDialog({ mergeGain: 5, mergeCount: 2 });

    const merge = screen.getByRole("button", {
      name: /Merge 2 into your best copies/,
    });
    expect(merge.textContent).toContain("5");
  });

  it("runs the merge, and not a sale or a scrap, when it is pressed", () => {
    const { onMerge, onSell, onScrap } = renderDialog({
      mergeGain: 5,
      mergeCount: 2,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Merge 2 into your best copies/ }),
    );

    expect(onMerge).toHaveBeenCalledTimes(1);
    expect(onSell).not.toHaveBeenCalled();
    expect(onScrap).not.toHaveBeenCalled();
  });

  it("hides the option when nothing in the batch can be merged", () => {
    // Every copy carries workshop levels or an earlier merge: the server would
    // skip all of them, so there is nothing to put on a button.
    renderDialog({ mergeGain: 0, mergeCount: 0 });

    expect(screen.queryByRole("button", { name: /Merge/ })).toBeNull();
  });

  it("hides the option for a view that does not know how to merge", () => {
    renderDialog({ onMerge: undefined, mergeGain: 5, mergeCount: 2 });

    expect(screen.queryByRole("button", { name: /Merge/ })).toBeNull();
  });

  it("leaves selling and scrapping where they were", () => {
    renderDialog({ mergeGain: 5, mergeCount: 2 });

    expect(screen.getByRole("button", { name: /Sell all 2/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Scrap/ })).toBeTruthy();
  });

  it("switches every option off while a merge is running", () => {
    renderDialog({ mergeGain: 5, mergeCount: 2, isMerging: true });

    for (const name of [/Sell all/, /Scrap/, /Merging/]) {
      expect(
        (screen.getByRole("button", { name }) as HTMLButtonElement).disabled,
      ).toBe(true);
    }
  });
});
