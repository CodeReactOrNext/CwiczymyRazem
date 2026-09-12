// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { afterEach, describe, expect, it } from "vitest";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { DexView } from "./DexView";

afterEach(cleanup);

/** The Dex reads only the four collection fields; the rest of the account is irrelevant here. */
const account = (overrides: Partial<ArsenalUserData> = {}) =>
  ({
    inventory: [],
    effectInventory: [],
    dexGuitars: [],
    dexEffects: [],
    ...overrides,
  }) as unknown as ArsenalUserData;

const slotNumbers = () =>
  Array.from(document.querySelectorAll(".tabular-nums"))
    .map((el) => el.textContent ?? "")
    .filter((t) => /^\d{2}$/.test(t));

describe("DexView", () => {
  it("hangs the first eighteen guitars on the first wall, numbered by catalog position", () => {
    render(<DexView data={account()} />);

    expect(screen.getByText("Discoveries")).toBeTruthy();
    expect(slotNumbers()).toEqual(
      Array.from({ length: 18 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
    expect(screen.getByText("1 / 5")).toBeTruthy();
    // Nothing discovered: every plate is a question mark.
    expect(screen.getAllByText("???")).toHaveLength(18);
  });

  it("pages through the walls and switches to the pedal wall", () => {
    render(<DexView data={account()} />);

    fireEvent.click(screen.getByRole("button", { name: "Next wall" }));
    expect(screen.getByText("2 / 5")).toBeTruthy();
    expect(slotNumbers()[0]).toBe("19");

    fireEvent.click(screen.getByRole("button", { name: /Pedals/ }));
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(slotNumbers()[0]).toBe("01");
  });

  it("reveals discovered entries and lets Missing hide them", () => {
    const first = GUITAR_DEFINITIONS[0];
    render(<DexView data={account({ dexGuitars: [first.id] })} />);

    expect(screen.getByText(first.name)).toBeTruthy();
    // The count sits in its own span, so read the whole line, not one text node.
    expect(screen.getByText(/discovered ·/).textContent).toMatch(
      /1 \/ 105 discovered · 1%/,
    );

    fireEvent.click(screen.getByRole("button", { name: "Missing" }));
    expect(screen.queryByText(first.name)).toBeNull();
    expect(slotNumbers()[0]).toBe("02");
  });

  it("finds a discovered guitar by name but never a locked one", () => {
    const first = GUITAR_DEFINITIONS[0];
    const locked = GUITAR_DEFINITIONS[5];
    render(<DexView data={account({ dexGuitars: [first.id] })} />);

    const search = screen.getByLabelText("Search discoveries");
    fireEvent.change(search, { target: { value: first.name } });
    expect(screen.getAllByText(first.name).length).toBeGreaterThan(0);

    fireEvent.change(search, { target: { value: locked.name } });
    expect(screen.queryByText(locked.name)).toBeNull();
    expect(screen.getByText(/Nothing on this wall matches/)).toBeTruthy();
  });
});
