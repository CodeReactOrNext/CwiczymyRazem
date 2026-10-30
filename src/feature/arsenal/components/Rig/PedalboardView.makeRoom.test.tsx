// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ArsenalUserData,
  PedalboardPlacement,
} from "../../types/arsenal.types";
import { geometryOf } from "../../utils/pedalboardLayout";
import { PedalboardView } from "./PedalboardView";

vi.mock("./RigHardwarePanel", () => ({ RigHardwarePanel: () => null }));

afterEach(cleanup);

const BOARD_RECT = { left: 0, top: 0, width: 800, height: 350 };

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    ...BOARD_RECT,
    right: BOARD_RECT.width,
    bottom: BOARD_RECT.height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

const ROWS = geometryOf(0).rowYPct;

/**
 * The starting case packed solid with twelve EchoPaths, and a Moss Drive that came
 * along with them and found nowhere to stand — so it is parked below the case.
 */
const fullBoard = (): ArsenalUserData => {
  const echoes = ROWS.flatMap((yPct, row) =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `e${row * 6 + i}`,
      xPct: 3 + i * 16,
      yPct,
    })),
  );
  return {
    inventory: [],
    equippedGuitarId: null,
    equippedItemId: null,
    effectInventory: [
      ...echoes.map((echo, i) => ({
        id: echo.id,
        effectId: 1,
        acquiredAt: 1_000 + i,
        isNew: false,
      })),
      { id: "ts", effectId: 2, acquiredAt: 5_000, isNew: false },
    ],
    parts: [],
    rig: {
      guitarSlots: [null, null, null],
      ampHeadId: null,
      ampId: null,
      power: [],
      pedalboardItems: [
        ...echoes.map(({ id, xPct, yPct }) => ({ itemId: id, xPct, yPct })),
        { itemId: "ts", xPct: 3, yPct: ROWS[0] },
      ],
    },
  };
};

const renderBoard = () => {
  const onUpdateItems = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PedalboardView
        data={fullBoard()}
        fame={0}
        onUpdateItems={onUpdateItems}
      />
    </QueryClientProvider>,
  );
  return { onUpdateItems };
};

/** A click on a pedal on the deck, the way the board reads one: a press that
 *  never travels. */
const tap = (el: HTMLElement) => {
  const at = { pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 };
  fireEvent.pointerDown(el, { ...at, button: 0 });
  fireEvent.pointerUp(window, at);
};

const echoOnDeck = (index: number) =>
  screen.getAllByAltText("EchoPath")[index].parentElement!;

describe("making room on a full board", () => {
  it("holds the pedal and lights every pedal it could be traded for", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /find room/i }));

    expect(screen.getByText(/no room for Moss Drive/i)).toBeTruthy();
    // Every EchoPath is as wide as the Moss Drive, so any of them would do.
    expect(screen.getAllByText("Swap")).toHaveLength(12);
  });

  it("trades the pedal in hand for the one tapped, in that one's slot", () => {
    vi.useFakeTimers();
    const { onUpdateItems } = renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /find room/i }));
    tap(echoOnDeck(2));
    vi.advanceTimersByTime(700);

    const [items, power] = onUpdateItems.mock.calls.at(-1)!;
    const ids = (items as PedalboardPlacement[]).map((i) => i.itemId);
    expect(ids).not.toContain("e2");
    expect(
      (items as PedalboardPlacement[]).find((i) => i.itemId === "ts"),
    ).toEqual({ itemId: "ts", xPct: 35, yPct: ROWS[0] });
    // It lands powered, so the swap is worth something straight away.
    expect(power.some((link: { itemId: string }) => link.itemId === "ts")).toBe(
      true,
    );
    expect(screen.queryByText(/no room for/i)).toBeNull();
    vi.useRealTimers();
  });

  it("puts the pedal back down on Escape", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /find room/i }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByText(/no room for/i)).toBeNull();
    expect(screen.queryAllByText("Swap")).toHaveLength(0);
  });
});
