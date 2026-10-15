// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EFFECT_DEFINITIONS } from "../../data/effectDefinitions";
import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "../../types/arsenal.types";
import { EffectCard } from "./EffectCard";
import { GuitarCard } from "./GuitarCard";

afterEach(cleanup);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const guitar = DROPPABLE_GUITARS[0];
const guitarItem: InventoryItem = {
  id: "g1",
  guitarId: guitar.id,
  acquiredAt: 1,
  isNew: false,
  year: guitar.yearTo,
  country: guitar.countries[0],
  condition: 0.5,
};

const effect = EFFECT_DEFINITIONS[0];
const effectItem: EffectInventoryItem = {
  id: "e1",
  effectId: effect.id,
  acquiredAt: 1,
  isNew: false,
  year: effect.yearTo,
  country: effect.countries?.[0],
  condition: 0.5,
};

const noop = () => undefined;

describe("the merge key on an item card", () => {
  it.each([
    [
      "guitar",
      (merge: React.ComponentProps<typeof GuitarCard>["merge"]) => (
        <GuitarCard item={guitarItem} onSellClick={noop} merge={merge} />
      ),
    ],
    [
      "pedal",
      (merge: React.ComponentProps<typeof EffectCard>["merge"]) => (
        <EffectCard item={effectItem} onSellClick={noop} merge={merge} />
      ),
    ],
  ])("shows what the merge adds on a %s, and runs it", (_kind, card) => {
    const onClick = vi.fn();
    render(card({ gain: 3, onClick }), { wrapper: Wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Merge \+3/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "guitar",
      (merge: React.ComponentProps<typeof GuitarCard>["merge"]) => (
        <GuitarCard item={guitarItem} onSellClick={noop} merge={merge} />
      ),
    ],
    [
      "pedal",
      (merge: React.ComponentProps<typeof EffectCard>["merge"]) => (
        <EffectCard item={effectItem} onSellClick={noop} merge={merge} />
      ),
    ],
  ])("switches the key off on a %s and says why", (_kind, card) => {
    const onClick = vi.fn();
    render(
      card({
        gain: 0,
        disabled: true,
        reason: "This is your best copy — merge the others into it",
        onClick,
      }),
      { wrapper: Wrapper },
    );

    // No gain to promise, so no "+0" on the label.
    const key = screen.getByRole("button", {
      name: "Merge",
    }) as HTMLButtonElement;
    expect(key.disabled).toBe(true);
    expect(key.title).toBe("This is your best copy — merge the others into it");
    fireEvent.click(key);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not on the card at all when there is nothing to fold it into", () => {
    render(<GuitarCard item={guitarItem} onSellClick={noop} />, {
      wrapper: Wrapper,
    });

    expect(screen.queryByRole("button", { name: /Merge/ })).toBeNull();
  });
});
