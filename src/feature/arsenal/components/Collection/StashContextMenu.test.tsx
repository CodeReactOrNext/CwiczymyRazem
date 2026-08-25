// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Info, Trash2 } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StashMenuItem } from "./StashContextMenu";
import { StashContextMenu } from "./StashContextMenu";

afterEach(cleanup);

const items = (overrides: Partial<StashMenuItem>[] = []): StashMenuItem[] => [
  { id: "details", label: "Details", icon: Info, onSelect: vi.fn() },
  {
    id: "sell",
    label: "Sell",
    icon: Trash2,
    danger: true,
    onSelect: vi.fn(),
    ...overrides[0],
  },
];

describe("StashContextMenu", () => {
  it("stays out of the way until a socket is right-clicked", () => {
    render(
      <StashContextMenu
        anchor={null}
        title='Epic Pickup'
        items={items()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("Details")).toBeNull();
  });

  it("names the piece it was opened on and offers its actions", () => {
    render(
      <StashContextMenu
        anchor={{ x: 120, y: 40 }}
        title='Epic Pickup'
        items={items()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Epic Pickup")).toBeTruthy();
    expect(screen.getByText("Details")).toBeTruthy();
    expect(screen.getByText("Sell")).toBeTruthy();
  });

  it("runs the action that was picked", () => {
    const onSelect = vi.fn();
    render(
      <StashContextMenu
        anchor={{ x: 10, y: 10 }}
        title='Amber Forge Wood'
        items={items([{ onSelect }])}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Sell"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("keeps a blocked action listed, off, and says why", () => {
    const onSelect = vi.fn();
    render(
      <StashContextMenu
        anchor={{ x: 10, y: 10 }}
        title='Amber Forge Wood'
        items={items([
          {
            onSelect,
            disabled: true,
            reason: "Take it off the pedalboard first",
          },
        ])}
        onClose={vi.fn()}
      />,
    );

    // A missing row would leave the player guessing; the row explains itself.
    const sell = screen.getByText("Sell").closest("[role='menuitem']");
    expect(sell?.getAttribute("data-disabled")).not.toBeNull();
    expect(sell?.getAttribute("title")).toBe(
      "Take it off the pedalboard first",
    );

    fireEvent.click(screen.getByText("Sell"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
