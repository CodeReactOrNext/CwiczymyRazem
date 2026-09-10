import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import { createContext, useContext } from "react";

import { getRarityLockedAtLvl } from "../data/rarityCap";

/**
 * The account level, for the screens that show the player their *own* gear.
 *
 * A context rather than a prop because the cap has to reach the same card in a
 * dozen places — the stash, the rig pickers, the hover previews, the market —
 * and threading a number through every one of them would put the rule in
 * twenty files instead of one.
 *
 * `null` is the honest default: gear also shows up where it is somebody else's
 * (a profile, the leaderboard's rig preview, a log entry), and "you need level
 * 15" is nonsense written across a stranger's guitar. Only a screen that knows
 * it is showing the player their own collection provides a level, so everywhere
 * else the badge simply never appears.
 */
const PlayerLvlContext = createContext<number | null>(null);

export const PlayerLvlProvider = PlayerLvlContext.Provider;

/** The viewer's level, or null on a screen showing somebody else's gear. */
export const usePlayerLvl = (): number | null => useContext(PlayerLvlContext);

/**
 * The level this item still needs before it can go in the rig, or null when it
 * can go in already — and null, too, when nobody has said whose gear this is.
 *
 * `inUse` carries the grandfather clause from `findBlockedRigChange`: the cap
 * only ever refuses something *newly* brought in, so a piece already standing in
 * a slot is not locked and must not be badged as though it were.
 */
export const rarityLockLvl = (
  rarity: GuitarRarity | null | undefined,
  playerLvl: number | null,
  inUse = false,
): number | null => {
  if (!rarity || playerLvl == null || inUse) return null;
  return getRarityLockedAtLvl(rarity, playerLvl) ?? null;
};
