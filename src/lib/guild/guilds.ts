import { challengeTierOf } from "feature/guilds/data/guildChallengeTiers";
import type { Guild, GuildMember } from "feature/guilds/types/guild.types";
import {
  checkGuildName,
  checkGuildTag,
  GUILD_DESCRIPTION_MAX,
  GUILD_NAME_MESSAGES,
  GUILD_TAG_MESSAGES,
  guildSlug,
  normaliseTag,
} from "feature/guilds/utils/guild.utils";
import { readCosmetics } from "feature/guilds/utils/guildCosmetics.utils";
import { isGuildLogoUrl } from "feature/guilds/utils/guildLogo";
import { readTreasury } from "feature/guilds/utils/guildTreasury.utils";
import {
  guildSeatLimit,
  guildStashRowLimit,
  readFund,
} from "feature/guilds/utils/guildUpgrades.utils";
import { GUILD_FOUNDING_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  findMyApplication,
  readApplications,
} from "lib/guild/guildApplications";
import { badgeFor, clearBadge } from "lib/guild/guildBadge";
import { readChallenge } from "lib/guild/guildChallenge";
import { readFame } from "lib/support/fameWallet";
import type {
  PlayerSession,
  SupporterSession,
} from "lib/support/supporterAuth";
import { chargeTokens, describeWallet, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Guilds: a named group a supporter founds with tokens and anyone can join.
 *
 * Two identities are claimed at once — the name and the short tag — and both
 * have to be unique or a member list becomes unreadable. Rather than searching
 * before writing (which leaves a window where two founders both see a name
 * free), each is a document id: the guild lives under its own name slug, and a
 * marker document is written under the tag. Firestore decides both, inside the
 * same transaction that charges the tokens, so a collision costs nothing.
 */

const GUILDS = "guilds";
const TAGS = "guildTags";

const BOARD_LIMIT = 100;

const guildRef = (id: string): DocumentReference =>
  firestore.collection(GUILDS).doc(id);

const tagRef = (tag: string): DocumentReference =>
  firestore.collection(TAGS).doc(tag);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toGuild = (doc: DocumentSnapshot): Guild => {
  const data = doc.data() ?? {};
  const createdAt = data.createdAt?.toDate?.() ?? null;
  const members = (data.members ?? []) as GuildMember[];

  return {
    id: doc.id,
    name: data.name ?? doc.id,
    tag: data.tag ?? "",
    logo: typeof data.logo === "string" ? data.logo : null,
    description: data.description ?? "",
    founderUid: data.founderUid ?? "",
    founderName: data.founderName ?? "",
    // Counted off the roster rather than a stored number: one source, so the
    // badge on the card can never disagree with the list under it.
    memberCount: members.length,
    memberLimit: guildSeatLimit(data.seatUpgrades),
    seatUpgrades: num(data.seatUpgrades),
    stashRowLimit: guildStashRowLimit(data.stashUpgrades),
    stashUpgrades: num(data.stashUpgrades),
    // Both pots travel with every guild rather than only the caller's own: the
    // browser prices the seats of a guild somebody is looking at joining, and
    // one small map either way is cheaper than a second read to get them.
    funds: {
      seats: readFund("seats", data),
      stashRows: readFund("stashRows", data),
    },
    cosmetics: readCosmetics(data.cosmetics),
    members,
    challengeStreak: num(data.challengeStreak),
    challengeTier: challengeTierOf(data.challengeTier).id,
    treasury: readTreasury(data),
    createdAt: createdAt ? createdAt.toISOString() : new Date(0).toISOString(),
  };
};

/** Biggest first; a tie goes to whichever was founded earlier. */
const rankGuilds = (guilds: Guild[]): Guild[] =>
  [...guilds].sort(
    (a, b) =>
      b.memberCount - a.memberCount || a.createdAt.localeCompare(b.createdAt),
  );

export async function readGuilds(session: PlayerSession) {
  const [snap, user] = await Promise.all([
    firestore.collection(GUILDS).limit(BOARD_LIMIT).get(),
    userRef(session.uid).get(),
  ]);

  const docs = snap.docs as DocumentSnapshot[];
  const myGuildId = (user.data()?.guildId as string | undefined) ?? null;
  const mine = myGuildId ? docs.find((doc) => doc.id === myGuildId) : undefined;

  // Only the caller's own guild gets its week counted: the challenge costs an
  // aggregate per member, and nobody needs a live bar for a guild they are not
  // in.
  const challenge = mine
    ? await readChallenge(mine.id, mine.data() ?? {}, session.uid)
    : null;

  // The queue is the founder's business alone; everyone else gets an empty
  // list rather than a view of who is knocking.
  const isFounder = mine?.data()?.founderUid === session.uid;

  const [applications, myApplication] = await Promise.all([
    isFounder && mine ? readApplications(mine.id) : Promise.resolve([]),
    myGuildId ? Promise.resolve(null) : findMyApplication(session.uid),
  ]);

  return {
    guilds: rankGuilds(docs.map(toGuild)),
    myGuildId,
    foundingCost: GUILD_FOUNDING_COST,
    tokensLeft: describeWallet(user.data()).left,
    fame: readFame(user.data()),
    challenge,
    myApplication,
    applications,
    isFounder,
    isSupporter: session.isSupporter,
  };
}

export type GuildResult =
  | { ok: true }
  | { ok: false; status: 400 | 402 | 403 | 404 | 409; error: string };

const memberOf = (session: PlayerSession): GuildMember => ({
  uid: session.uid,
  displayName: session.displayName,
  avatar: session.avatar,
});

/**
 * Founds a guild: claims the name, claims the tag, charges the founder and
 * seats them as the first member — all or nothing.
 */
export async function foundGuild(
  session: SupporterSession,
  input: {
    name?: string;
    tag?: string;
    description?: string;
    logo?: string | null;
  },
): Promise<GuildResult> {
  const name = (input.name ?? "").trim();
  const nameProblem = checkGuildName(name);
  if (nameProblem) {
    return { ok: false, status: 400, error: GUILD_NAME_MESSAGES[nameProblem] };
  }

  const tag = normaliseTag(input.tag ?? "");
  const tagProblem = checkGuildTag(input.tag ?? "");
  if (tagProblem) {
    return { ok: false, status: 400, error: GUILD_TAG_MESSAGES[tagProblem] };
  }

  // Nothing is the normal case; anything that is not one of our own uploads is
  // a client that went around the picker, and is refused rather than stored.
  const logo = input.logo ?? null;
  if (logo !== null && !isGuildLogoUrl(logo)) {
    return { ok: false, status: 400, error: "That picture did not upload" };
  }

  const id = guildSlug(name);
  const description = (input.description ?? "")
    .trim()
    .slice(0, GUILD_DESCRIPTION_MAX);

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [guild, tagMarker, user] = await Promise.all([
      tx.get(guildRef(id)),
      tx.get(tagRef(tag)),
      tx.get(userRef(session.uid)),
    ]);

    if (guild.exists) return "name-taken" as const;
    if (tagMarker.exists) return "tag-taken" as const;
    if (user.data()?.guildId) return "already-in-one" as const;
    if (!chargeTokens(tx, user, GUILD_FOUNDING_COST)) return "broke" as const;

    tx.set(guildRef(id), {
      name,
      tag,
      logo,
      description,
      founderUid: session.uid,
      founderName: session.displayName,
      members: [memberOf({ ...session, isSupporter: true })],
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(tagRef(tag), { guildId: id, at: FieldValue.serverTimestamp() });
    tx.update(userRef(session.uid), {
      guildId: id,
      guildBadge: badgeFor(id, { tag }),
    });

    return "ok" as const;
  });

  if (outcome === "name-taken") {
    return { ok: false, status: 409, error: "That name is taken" };
  }
  if (outcome === "tag-taken") {
    return { ok: false, status: 409, error: "That tag is taken" };
  }
  if (outcome === "already-in-one") {
    return {
      ok: false,
      status: 409,
      error: "You are already in a guild — leave it first",
    };
  }
  if (outcome === "broke") {
    return {
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    };
  }

  return { ok: true };
}

/**
 * Seats a player directly, without a request. Kept for the founder's own seat
 * at creation and for anything server-side that has already decided; the way in
 * for everyone else is an application — see `guildApplications`.
 */
export async function joinGuild(
  session: PlayerSession,
  guildId: string,
): Promise<GuildResult> {
  if (!guildId) return { ok: false, status: 400, error: "Missing guild" };

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [guild, user] = await Promise.all([
      tx.get(guildRef(guildId)),
      tx.get(userRef(session.uid)),
    ]);

    if (!guild.exists) return "missing" as const;
    if (user.data()?.guildId) return "already-in-one" as const;

    const data = guild.data() ?? {};
    const members = (data.members ?? []) as GuildMember[];
    if (members.length >= guildSeatLimit(data.seatUpgrades)) {
      return "full" as const;
    }
    if (members.some((member) => member.uid === session.uid)) {
      return "ok" as const;
    }

    tx.update(guildRef(guildId), {
      members: [...members, memberOf(session)],
    });
    tx.update(userRef(session.uid), {
      guildId,
      guildBadge: badgeFor(guildId, data),
    });

    return "ok" as const;
  });

  if (outcome === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome === "already-in-one") {
    return {
      ok: false,
      status: 409,
      error: "You are already in a guild — leave it first",
    };
  }
  if (outcome === "full") {
    return { ok: false, status: 409, error: "That guild is full" };
  }

  return { ok: true };
}

/**
 * Leaves the guild. The founder can only walk out of an empty one, and doing so
 * disbands it — a guild whose founder left while others were still in it would
 * have nobody able to admit anyone or take the name back.
 */
export async function leaveGuild(session: PlayerSession): Promise<GuildResult> {
  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return "not-in-one" as const;

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) {
      // The guild is gone but the pointer survived; clear it so the player is
      // not locked out of joining another.
      tx.update(userRef(session.uid), {
        guildId: FieldValue.delete(),
        guildBadge: clearBadge(),
      });
      return "ok" as const;
    }

    const data = guild.data() ?? {};
    const members = (data.members ?? []) as GuildMember[];
    const remaining = members.filter((member) => member.uid !== session.uid);

    if (data.founderUid === session.uid) {
      if (remaining.length > 0) return "founder-blocked" as const;

      tx.delete(guildRef(guildId));
      if (data.tag) tx.delete(tagRef(data.tag));
    } else {
      tx.update(guildRef(guildId), { members: remaining });
    }

    tx.update(userRef(session.uid), {
      guildId: FieldValue.delete(),
      guildBadge: clearBadge(),
    });
    return "ok" as const;
  });

  if (outcome === "not-in-one") {
    return { ok: false, status: 400, error: "You are not in a guild" };
  }
  if (outcome === "founder-blocked") {
    return {
      ok: false,
      status: 403,
      error: "A founder can only leave once everyone else has",
    };
  }

  return { ok: true };
}

export const guildInternals = { num };
