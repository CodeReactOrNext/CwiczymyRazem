// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { PedalboardView } from "./PedalboardView";

// The Fame shop riding on the board's heading reaches into the legacy store.
// It has nothing to do with what a finger can do to the deck.
vi.mock("./RigHardwarePanel", () => ({ RigHardwarePanel: () => null }));

afterEach(cleanup);

/** The deck, as jsdom would otherwise report it: nothing, nowhere, no size. */
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
  // jsdom lays nothing out, so the board would measure zero and every pan would
  // be clamped to the middle of a window it does not fill.
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: BOARD_RECT.width,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: BOARD_RECT.height,
  });
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
});

const data = (): ArsenalUserData => ({
  inventory: [],
  equippedGuitarId: null,
  equippedItemId: null,
  effectInventory: [
    { id: "e1", effectId: 1, acquiredAt: 1_000, isNew: false },
    { id: "e2", effectId: 2, acquiredAt: 2_000, isNew: false },
  ],
  parts: [],
  rig: {
    guitarSlots: [null, null, null],
    ampHeadId: null,
    ampId: null,
    power: [],
    pedalboardItems: [
      { itemId: "e1", xPct: 4, yPct: 5 },
      { itemId: "e2", xPct: 40, yPct: 5 },
    ],
  },
});

const renderBoard = (onShowCard?: (content: React.ReactNode) => void) => {
  const onUpdateItems = vi.fn();
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <PedalboardView
        data={data()}
        fame={0}
        onUpdateItems={onUpdateItems}
        onShowCard={onShowCard}
      />
    </QueryClientProvider>,
  );
  return { onUpdateItems, container };
};

/** The pedal's artwork is what a finger lands on; the drag lives on its frame. */
const pedal = (name: RegExp) => screen.getByAltText(name).parentElement!;

/** The deck itself — inside the movable view, but not a pedal. */
const deck = () => pedal(/EchoPath/).parentElement!;

/** How the case is currently being drawn, if it is being drawn at all. */
const transform = (container: HTMLElement) =>
  (container.querySelector('[style*="transform-origin"]') as HTMLElement | null)
    ?.style.transform ?? null;

const press = (el: HTMLElement, x: number, y: number) =>
  fireEvent.pointerDown(el, {
    button: 0,
    pointerId: 1,
    pointerType: "touch",
    clientX: x,
    clientY: y,
  });

const moveTo = (x: number, y: number) =>
  fireEvent.pointerMove(window, {
    pointerId: 1,
    pointerType: "touch",
    clientX: x,
    clientY: y,
  });

const release = (x: number, y: number) =>
  fireEvent.pointerUp(window, {
    pointerId: 1,
    pointerType: "touch",
    clientX: x,
    clientY: y,
  });

describe("PedalboardView on a touch screen", () => {
  it("carries a pedal across the board with one finger", () => {
    vi.useFakeTimers();
    const { onUpdateItems } = renderBoard(vi.fn());

    press(pedal(/EchoPath/), 40, 40);
    moveTo(300, 60);
    release(300, 60);

    // The board saves on a debounce — the move is only real once it lands.
    // Dropped on its neighbour, the two trade slots: e1 finishes in e2's.
    vi.advanceTimersByTime(700);
    expect(onUpdateItems).toHaveBeenCalled();
    const [items] = onUpdateItems.mock.calls.at(-1)!;
    expect(items.find((i: { itemId: string }) => i.itemId === "e1")!.xPct).toBe(
      40,
    );
    vi.useRealTimers();
  });

  it("opens the pedal's card when the press never travels", () => {
    const onShowCard = vi.fn();
    const { onUpdateItems } = renderBoard(onShowCard);

    press(pedal(/EchoPath/), 40, 40);
    moveTo(42, 41);
    release(42, 41);

    expect(onShowCard).toHaveBeenCalledTimes(1);
    expect(onUpdateItems).not.toHaveBeenCalled();
  });

  it("leaves a carried pedal's card shut, so a drag is never also a tap", () => {
    const onShowCard = vi.fn();
    renderBoard(onShowCard);

    press(pedal(/EchoPath/), 40, 40);
    moveTo(300, 60);
    release(300, 60);

    expect(onShowCard).not.toHaveBeenCalled();
  });

  it("keeps the deck clear of the buttons a cursor would reveal", () => {
    renderBoard(vi.fn());

    // They live in the card a tap opens instead — a board wearing a button per
    // pedal is a board nobody can see.
    expect(screen.queryAllByLabelText(/off the board/i)).toHaveLength(0);
    expect(screen.queryAllByLabelText(/^Unplug /)).toHaveLength(0);
  });
});

describe("PedalboardView zoomed in", () => {
  const finger = (
    type: "pointerDown" | "pointerMove" | "pointerUp",
    id: number,
    x: number,
    y: number,
  ) =>
    fireEvent[type](deck(), {
      button: 0,
      pointerId: id,
      pointerType: "touch",
      clientX: x,
      clientY: y,
    });

  it("sits at life size until somebody asks for more", () => {
    const { container } = renderBoard(vi.fn());

    expect(transform(container)).toBeNull();
    expect(screen.queryByLabelText(/fit the whole board/i)).toBeNull();
  });

  it("grows a step at a time, holding the middle of the window", () => {
    const { container } = renderBoard(vi.fn());

    fireEvent.click(screen.getByLabelText(/zoom in/i));

    // 800 × 350 window, board the same: half a step up puts its middle back
    // where it was rather than sliding it off the left.
    expect(transform(container)).toBe("translate(-200px, -87.5px) scale(1.5)");
  });

  it("stops growing at the top of the range", () => {
    renderBoard(vi.fn());
    const zoomIn = screen.getByLabelText(/zoom in/i) as HTMLButtonElement;

    for (let i = 0; i < 8; i += 1) fireEvent.click(zoomIn);

    expect(zoomIn.disabled).toBe(true);
  });

  it("pinches open under two fingers", () => {
    const { container } = renderBoard(vi.fn());

    finger("pointerDown", 1, 300, 150);
    finger("pointerDown", 2, 400, 150);
    finger("pointerMove", 2, 500, 150);

    // Twice the span between the fingers is twice the board.
    expect(transform(container)).toContain("scale(2)");
  });

  it("pushes the board around once there is more of it than window", () => {
    const { container } = renderBoard(vi.fn());
    fireEvent.click(screen.getByLabelText(/zoom in/i));

    finger("pointerDown", 1, 400, 200);
    finger("pointerMove", 1, 460, 220);

    expect(transform(container)).toBe("translate(-140px, -67.5px) scale(1.5)");
  });

  it("leaves a swipe alone at life size, so the page still scrolls", () => {
    const { container } = renderBoard(vi.fn());

    finger("pointerDown", 1, 400, 200);
    finger("pointerMove", 1, 460, 260);

    expect(transform(container)).toBeNull();
  });

  it("puts the whole board back in one press", () => {
    const { container } = renderBoard(vi.fn());
    fireEvent.click(screen.getByLabelText(/zoom in/i));

    fireEvent.click(screen.getByLabelText(/fit the whole board/i));

    expect(transform(container)).toBeNull();
  });

  it("keeps the zoom keys to itself — a press on one is not a press on the board", () => {
    const { container } = renderBoard(vi.fn());

    fireEvent.pointerDown(screen.getByLabelText(/zoom in/i), {
      pointerId: 9,
      pointerType: "touch",
      clientX: 700,
      clientY: 300,
    });
    fireEvent.pointerMove(deck(), {
      pointerId: 9,
      pointerType: "touch",
      clientX: 600,
      clientY: 300,
    });

    expect(transform(container)).toBeNull();
  });
});

describe("PedalboardView full screen", () => {
  const open = () =>
    fireEvent.click(screen.getByLabelText(/open the board full screen/i));

  it("takes the board out of the page and gives it the screen", () => {
    const { container } = renderBoard(vi.fn());

    open();

    expect(container.contains(pedal(/EchoPath/))).toBe(false);
    expect(document.body.querySelector(".fixed.inset-0")).toBeTruthy();
  });

  it("brings the board's own buttons along, and leaves none behind", () => {
    renderBoard(vi.fn());

    open();

    expect(screen.getAllByText("Add pedal")).toHaveLength(1);
  });

  it("keeps the board exactly as it was left — it moves, it is not rebuilt", () => {
    renderBoard(vi.fn());

    // Trade the two pedals over, then go full screen: the swap has to survive
    // the move, or a player loses their board every time they open it up.
    press(pedal(/EchoPath/), 40, 40);
    moveTo(300, 60);
    release(300, 60);
    expect(pedal(/EchoPath/).style.left).toBe("40%");

    open();

    expect(pedal(/EchoPath/).style.left).toBe("40%");
  });

  it("lets the whole case be shrunk to fit, which the page never needs", () => {
    renderBoard(vi.fn());
    const zoomOut = () =>
      screen.getByLabelText(/zoom out/i) as HTMLButtonElement;

    expect(zoomOut().disabled).toBe(true);
    open();
    expect(zoomOut().disabled).toBe(false);

    fireEvent.click(zoomOut());

    expect(transform(document.body)).toBe(
      "translate(200px, 87.5px) scale(0.5)",
    );
  });

  it("comes back to the page when asked", () => {
    const { container } = renderBoard(vi.fn());
    open();

    fireEvent.click(screen.getByLabelText(/leave full screen/i));

    expect(container.contains(pedal(/EchoPath/))).toBe(true);
    expect(transform(container)).toBeNull();
  });

  it("comes back on Escape too", () => {
    const { container } = renderBoard(vi.fn());
    open();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(container.contains(pedal(/EchoPath/))).toBe(true);
  });

  it("holds the page still underneath while it is open", () => {
    renderBoard(vi.fn());

    open();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByLabelText(/leave full screen/i));
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("PedalboardView with a mouse", () => {
  it("still carries a pedal, and keeps its buttons on the pedal", () => {
    vi.useFakeTimers();
    const { onUpdateItems } = renderBoard(undefined);

    expect(screen.getAllByLabelText(/off the board/i)).toHaveLength(2);

    fireEvent.pointerDown(pedal(/EchoPath/), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 40,
      clientY: 40,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 300,
      clientY: 60,
    });
    fireEvent.pointerUp(window, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 300,
      clientY: 60,
    });

    vi.advanceTimersByTime(700);
    expect(onUpdateItems).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
