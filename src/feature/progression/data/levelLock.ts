/**
 * The words the game uses for "you cannot have this yet, but you will".
 *
 * One phrase, wherever a level stands between the player and something they can
 * see: gear on an item card, a rig picker, the right-click menu in the stash, a
 * milestone tier on the Milestones page. Two screens wording the same rule two
 * ways is how a player ends up believing they are two different rules.
 */
export const unlocksAtLevelLabel = (lvl: number): string =>
  `Unlocks at level ${lvl}`;

/**
 * The level `requiredLvl` is still waiting for, or null once it has been
 * reached — and null, too, when nobody has said whose account this is.
 *
 * `owned` is the grandfather clause every one of these gates needs: a level
 * ladder that shipped after the thing it gates must never take away what an
 * account already has. Gear already in a rig stays in it, and a milestone tier
 * already bought stays bought and claimable, whatever the account's level.
 */
export const lockedAtLvl = (
  requiredLvl: number,
  playerLvl: number | null,
  owned = false,
): number | null => {
  if (playerLvl == null || owned || playerLvl >= requiredLvl) return null;
  return requiredLvl;
};
