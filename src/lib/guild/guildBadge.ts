import type { GuildBadge, GuildMember } from "feature/guilds/types/guild.types";
import {
  equippedItem,
  readCosmetics,
} from "feature/guilds/utils/guildCosmetics.utils";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild badge every member carries on their own user document.
 *
 * A copy, and knowingly so. The leaderboard, the chat and the profile all read
 * `users`; none of them may read `guilds`, which is Admin-SDK-only in
 * `firestore.rules` and stays that way — a client able to read guild documents
 * could enumerate every roster in the game. Denormalising four short fields is
 * what lets a tag appear next to a name without a second read on every row of
 * a page that lists fifty players.
 *
 * The copy is written under `guildBadge`, a key the users rule forbids clients
 * from touching, so a player cannot award themselves a guild they are not in.
 */

const GUILDS = "guilds";

/** What a guild's stored document says its members should be wearing. */
export const badgeFor = (
  guildId: string,
  data: Record<string, any> | undefined,
): GuildBadge => {
  const cosmetics = readCosmetics(data?.cosmetics);

  return {
    guildId,
    tag: typeof data?.tag === "string" ? data.tag : "",
    accent: equippedItem(cosmetics, "accent").id,
    frame: equippedItem(cosmetics, "frame").id,
  };
};

/**
 * Taken off on the way out, so a former member stops wearing the tag.
 *
 * A function rather than a constant: a constant would call into the Admin SDK
 * at import time, which makes merely importing anything in this file depend on
 * the SDK being ready — and takes down every test that mocks a narrower slice
 * of `FieldValue` than this one line happens to need.
 */
export const clearBadge = () => FieldValue.delete();

/**
 * Re-stamps the badge on every member after the guild changes what it wears.
 *
 * Runs after the transaction rather than inside it: a roster is capped at a few
 * dozen, and a transaction that touched all of them would take a lock on every
 * member's user document — including whoever happens to be filing a practice
 * report at that moment — to change a colour.
 *
 * The trade-off is that a failure here leaves members wearing the previous
 * colour while the guild document has already moved on. That is the right way
 * round: the purchase is what was paid for and it is safely committed, the
 * badge is cosmetic, and the next buy or equip re-stamps everyone anyway.
 */
export async function syncGuildBadges(guildId: string): Promise<void> {
  try {
    const guild = await firestore.collection(GUILDS).doc(guildId).get();
    if (!guild.exists) return;

    const data = guild.data() ?? {};
    const members = (data.members ?? []) as GuildMember[];
    if (members.length === 0) return;

    const badge = badgeFor(guildId, data);
    const batch = firestore.batch();

    for (const member of members) {
      batch.update(firestore.collection("users").doc(member.uid), {
        guildBadge: badge,
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("[guildBadge] could not re-stamp the roster", guildId, error);
  }
}
