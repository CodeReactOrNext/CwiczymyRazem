import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { useStashMutations } from "feature/guilds/hooks/useGuildStash";
import { stashHonorValue } from "feature/guilds/utils/guildHonor.utils";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

export type ShelfGearKind = "guitar" | "effect";

/** A piece of gear on its way to the guild stash, as the confirm describes it. */
export interface ShelfDepositTarget {
  kind: ShelfGearKind;
  name: string;
  rarity: string;
  /** What leaving it pays — the honor the server credits for it. */
  honor: number;
}

/**
 * Names the piece the way the shelf will. The honor is priced off the model's
 * own rarity, not a workshop promotion — the same rarity the server reads when
 * it credits the deposit, so the number shown is the number paid.
 */
export const resolveShelfDepositTarget = (
  data: Pick<ArsenalUserData, "inventory" | "effectInventory">,
  pending: { kind: ShelfGearKind; itemId: string },
): ShelfDepositTarget | null => {
  if (pending.kind === "guitar") {
    const item = data.inventory.find((i) => i.id === pending.itemId);
    const def = item ? GUITARS_BY_ID.get(item.guitarId) : undefined;
    if (!def) return null;
    return {
      kind: "guitar",
      name: `${def.brand} ${def.name}`,
      rarity: def.rarity,
      honor: stashHonorValue("guitar", def.rarity),
    };
  }

  const item = (data.effectInventory ?? []).find(
    (i) => i.id === pending.itemId,
  );
  const def = item ? EFFECTS_BY_ID.get(item.effectId) : undefined;
  if (!def) return null;
  return {
    kind: "effect",
    name: `${def.brand} ${def.name}`,
    rarity: def.rarity,
    honor: stashHonorValue("effect", def.rarity),
  };
};

/**
 * Leaving gear in the guild stash straight from the collection — the deposit the
 * guild's Stash tab makes, behind a confirm: here the stash isn't on screen when
 * the key is pressed, and the piece stops being the player's the moment it lands.
 */
export const useShelfDeposit = (
  data: Pick<ArsenalUserData, "inventory" | "effectInventory">,
) => {
  // The badge is stamped by the server on members only, so it answers "in a
  // guild?" without a read. The deposit route checks membership again anyway.
  const inGuild = Boolean(useAppSelector(selectUserInfo)?.guildBadge?.guildId);
  const { deposit } = useStashMutations();
  const [pending, setPending] = useState<{
    kind: ShelfGearKind;
    itemId: string;
  } | null>(null);

  return {
    inGuild,
    isDepositing: deposit.isPending,
    ask: (kind: ShelfGearKind, itemId: string) => setPending({ kind, itemId }),
    dialog: {
      target: pending ? resolveShelfDepositTarget(data, pending) : null,
      busy: deposit.isPending,
      onCancel: () => setPending(null),
      onConfirm: () => {
        if (!pending) return;
        deposit.mutate(
          { kind: pending.kind, inventoryItemId: pending.itemId },
          { onSuccess: () => setPending(null) },
        );
      },
    },
  };
};
