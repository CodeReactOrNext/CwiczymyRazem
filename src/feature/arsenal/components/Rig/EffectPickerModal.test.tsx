// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { EffectPickerModal } from "./EffectPickerModal";

afterEach(cleanup);

/** Effect 1 is EchoPath, effect 2 the TS-808 — both plain, no rolled extras. */
const copy = (
  id: string,
  effectId: number,
  overrides: Partial<EffectInventoryItem> = {},
): EffectInventoryItem => ({
  id,
  effectId,
  acquiredAt: 1_000,
  isNew: false,
  ...overrides,
});

const echoPathTiles = () =>
  screen.getAllByRole("button", { name: /EchoPath/ }) as HTMLButtonElement[];

describe("EffectPickerModal", () => {
  it("lists every copy of a pedal, not just one per model", () => {
    render(
      <EffectPickerModal
        effectInventory={[
          copy("e1", 1),
          copy("e2", 1, { acquiredAt: 2_000, buildLevel: 3 }),
          copy("e3", 1, { acquiredAt: 3_000 }),
          copy("t1", 2),
        ]}
        occupiedItemIds={[]}
        slotIndex={0}
        currentItemId={null}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(echoPathTiles()).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /TS-808/ })).toHaveLength(1);
  });

  it("leaves the spare copies pickable while the fitted one is taken", () => {
    const onSelect = vi.fn();
    render(
      <EffectPickerModal
        effectInventory={[copy("e1", 1), copy("e2", 1), copy("e3", 1)]}
        occupiedItemIds={["e1"]}
        slotIndex={1}
        currentItemId={null}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const tiles = echoPathTiles();
    expect(tiles.filter((tile) => tile.disabled)).toHaveLength(1);

    const spare = tiles.find((tile) => !tile.disabled);
    fireEvent.click(spare!);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(["e2", "e3"]).toContain(onSelect.mock.calls[0][0]);
  });
});
