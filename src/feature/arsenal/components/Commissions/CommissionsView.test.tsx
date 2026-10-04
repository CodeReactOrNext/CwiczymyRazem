// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  COMMISSION_FAME,
  getCommissionParts,
  getGuitarCommissionSubject,
} from "feature/arsenal/data/commission";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { isTrophyGuitar } from "feature/arsenal/data/trophyGuitars";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { getCommissionCatalog } from "feature/arsenal/utils/commissionCatalog";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommissionsView } from "./CommissionsView";

const mutate = vi.fn();
vi.mock("feature/arsenal/hooks/useWorkshopCommission", () => ({
  useWorkshopCommission: () => ({
    mutate,
    reset: vi.fn(),
    isPending: false,
    data: undefined,
  }),
}));
// The instance preview is the full item card, which reads the player's level
// and trait state from providers this test has no business standing up.
vi.mock("../GuitarInventory/GuitarCard", () => ({
  GuitarCard: () => <div>instance preview</div>,
}));
vi.mock("../GuitarInventory/EffectCard", () => ({
  EffectCard: () => <div>instance preview</div>,
}));

afterEach(() => {
  cleanup();
  mutate.mockReset();
});

const account = (overrides: Partial<ArsenalUserData> = {}) =>
  ({
    inventory: [],
    effectInventory: [],
    dexGuitars: [],
    dexEffects: [],
    parts: [],
    ...overrides,
  }) as ArsenalUserData;

const cards = () => screen.queryAllByRole("button", { name: /^Commission .+/ });

const NON_TROPHY_GUITARS = GUITAR_DEFINITIONS.filter(
  (g) => !isTrophyGuitar(g.id),
);

describe("CommissionsView", () => {
  it("opens on the guitars still missing, and switches to the pedals", () => {
    render(<CommissionsView data={account()} fame={0} />);

    expect(cards()).toHaveLength(NON_TROPHY_GUITARS.length);
    expect(
      screen.getByText(
        String(NON_TROPHY_GUITARS.length + EFFECT_DEFINITIONS.length),
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Pedals/ }));
    expect(cards()).toHaveLength(EFFECT_DEFINITIONS.length);
  });

  it("narrows to one rarity", () => {
    render(<CommissionsView data={account()} fame={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Mythic" }));
    expect(cards()).toHaveLength(
      NON_TROPHY_GUITARS.filter((g) => g.rarity === "Mythic").length,
    );
  });

  it("never lists a model already in the Dex", () => {
    // A name no other model shares — some colourways do (two SV6 Cores).
    const known = NON_TROPHY_GUITARS.find(
      (g) =>
        NON_TROPHY_GUITARS.filter(
          (o) => o.brand === g.brand && o.name === g.name,
        ).length === 1,
    )!;
    render(
      <CommissionsView data={account({ dexGuitars: [known.id] })} fame={0} />,
    );

    expect(
      screen.queryByRole("button", {
        name: `Commission ${known.brand} ${known.name}`,
      }),
    ).toBeNull();
  });

  it("quotes the order and holds the button until it is paid for", () => {
    const [first] = getCommissionCatalog(account());
    render(<CommissionsView data={account()} fame={0} />);

    fireEvent.click(cards()[0]);

    expect(
      screen.getByText(`Commission ${first.target.def.name}`),
    ).toBeTruthy();
    expect(screen.getByText("Commission cost")).toBeTruthy();
    const order = screen.getByRole("button", { name: "Commission" });
    expect((order as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends the order for exactly the model on the card", () => {
    const [first] = getCommissionCatalog(account());
    if (first.target.kind !== "guitar") throw new Error("expected a guitar");
    const subject = getGuitarCommissionSubject(first.target.def);
    render(
      <CommissionsView
        data={account({
          parts: getCommissionParts(subject.bom, subject.rarity),
        })}
        fame={COMMISSION_FAME[subject.rarity as keyof typeof COMMISSION_FAME]}
      />,
    );

    fireEvent.click(cards()[0]);
    const order = screen.getByRole("button", { name: "Commission" });
    expect((order as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(order);

    expect(mutate).toHaveBeenCalledWith({
      kind: "guitar",
      definitionId: first.target.def.id,
    });
  });

  it("says so once there is nothing left to build", () => {
    render(
      <CommissionsView
        data={account({
          dexGuitars: GUITAR_DEFINITIONS.map((g) => g.id),
          dexEffects: EFFECT_DEFINITIONS.map((e) => e.id),
        })}
        fame={0}
      />,
    );

    expect(screen.getByText(/Your Dex is complete/)).toBeTruthy();
  });
});
