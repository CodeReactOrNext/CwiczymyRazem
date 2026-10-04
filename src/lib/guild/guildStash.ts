import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  GuildStash,
  PartsFromShelf,
  StashDeposit,
  StashEntry,
  StashItemKind,
  StashLogEntry,
  StashTally,
} from "feature/guilds/types/stash.types";
import type { StashCredit } from "feature/guilds/utils/guildHonor.utils";
import {
  honorFor,
  readHonor,
  stashHonorValue,
  TAKE_DAILY_LIMIT,
  takePrice,
} from "feature/guilds/utils/guildHonor.utils";
import {
  shelfHasRoom,
  shelfPiece,
} from "feature/guilds/utils/guildShelf.utils";
import { guildStashRowLimit } from "feature/guilds/utils/guildUpgrades.utils";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { DetachedLoose, DetachProblem } from "lib/guild/stashTransfer";
import {
  attachItem,
  attachMod,
  attachPart,
  detachItem,
  detachMod,
  detachPart,
} from "lib/guild/stashTransfer";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { getServerDateKey } from "utils/converter";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild stash: any member drops gear in, any member takes it out.
 *
 * Built as asked, with the trade-off stated rather than designed around. Gear
 * that circulates is gear that earns for whoever holds it, and rig level drives
 * Fame per hour — so one good instrument passed around a guild pays out roughly
 * as many times as the guild has members practising, off a single purchase. It
 * also gives away for free what the marketplace charges Fame for, and joining a
 * guild costs nothing, so nothing here stops a stack of alt accounts funnelling
 * into one main.
 *
 * What the design does provide is daylight: every deposit and every withdrawal
 * is logged with a name, and the per-member tally makes a member who only ever
 * takes visible to everyone else. The rarity of each entry is recorded too, so
 * a limit on what may be shared is one more check in `deposit` away.
 *
 * What is limited already is the room: the shelf is only as many rows as the
 * guild has chipped in for (see `lib/guild/guildFunding`), so a stash big
 * enough to kit out a dozen people is something the guild decided to build
 * rather than the default state of an empty room.
 *
 * And taking is no longer free. Leaving a piece earns honor by its rarity
 * (see `guildHonor.utils.ts`), and Fame or tokens put into the guild earn it
 * too — but taking one off the shelf costs a flat `TAKE_HONOR_COST`, the same
 * for a stack of screws as for a Custom Shop guitar. A price that scaled with
 * the item's own value made the best gear unreachable right after the one
 * deposit that would have paid for it; a flat toll does not. A member who
 * only ever takes runs out of honor to take with, which is the alt-account
 * funnel above closed without a rule about who may take — and `TAKE_DAILY_LIMIT`
 * is the other half of it: honor alone cannot walk out with the whole shelf
 * in one visit, however big the balance behind it.
 *
 * A flat toll under a rarity-priced deposit is only safe if each piece earns
 * once, or one Mythic left and lifted on repeat prints honor forever. So every
 * entry records who earned what leaving it (`credits`), and taking your own
 * back hands that honor back instead of paying the toll. And anything taken by
 * anyone else remembers the shelf it came off — gear and mods on the instance
 * (`honorEarnedIn`), parts as a per-member count (`partsFromShelf`) — so
 * leaving it here again earns nothing.
 */

const GUILDS = "guilds";
const STASH = "stash";
const LOG = "stashLog";
/** Guild document field: parts each member took off the shelf and has not put back. */
const PARTS_FROM_SHELF = "partsFromShelf";

/** Plenty for a shelf a guild reads through; the log is trimmed to a page. */
const STASH_LIMIT = 200;
const LOG_LIMIT = 60;

const guildRef = (guildId: string): DocumentReference =>
  firestore.collection(GUILDS).doc(guildId);

const stashRef = (guildId: string) => guildRef(guildId).collection(STASH);
const logRef = (guildId: string) => guildRef(guildId).collection(LOG);

const iso = (value: any): string | null => {
  const date = value?.toDate?.();
  return date ? date.toISOString() : null;
};

/**
 * Who on an entry earned honor for it, and how much.
 *
 * Entries left before credits were stored have none written down, but a gear
 * or mod deposit then always earned its full value for whoever left it, so
 * that is rebuilt. A part stack from then may have been topped up by several
 * members with no record of who left how many — it reads as nobody's, and
 * taking from it is an ordinary take.
 */
const creditsOf = (data: Record<string, any>): Record<string, StashCredit> => {
  if (data.credits && typeof data.credits === "object") {
    return Object.fromEntries(
      Object.entries(data.credits as Record<string, any>)
        .map(([uid, credit]) => [
          uid,
          {
            qty: Math.max(0, Math.floor(Number(credit?.qty) || 0)),
            honor: Math.max(0, Math.floor(Number(credit?.honor) || 0)),
          },
        ])
        .filter(([, credit]) => (credit as StashCredit).qty > 0),
    );
  }

  const kind = (data.kind ?? "guitar") as StashItemKind;
  if (kind === "part" || !data.depositedByUid) return {};
  return {
    [data.depositedByUid]: {
      qty: 1,
      honor: stashHonorValue(kind, data.rarity ?? ""),
    },
  };
};

/** Whether this guitar, pedal or mod has already earned honor on this shelf. */
const earnedHonorIn = (item: Record<string, any>, guildId: string) =>
  Array.isArray(item.honorEarnedIn) && item.honorEarnedIn.includes(guildId);

const markHonorEarned = <T extends Record<string, any>>(
  item: T,
  guildId: string,
): T =>
  earnedHonorIn(item, guildId)
    ? item
    : { ...item, honorEarnedIn: [...(item.honorEarnedIn ?? []), guildId] };

/** Pieces of one (part, tier) this member took off the shelf and has not put back. */
const partsFromShelfOf = (
  guildData: Record<string, any>,
  uid: string,
  partId: string,
  tier: string,
): number =>
  Math.max(
    0,
    Math.floor(
      Number(guildData[PARTS_FROM_SHELF]?.[uid]?.[partId]?.[tier]) || 0,
    ),
  );

const toEntry = (doc: DocumentSnapshot): StashEntry => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    kind: (data.kind ?? "guitar") as StashItemKind,
    name: data.name ?? "",
    rarity: data.rarity ?? "",
    item: data.item ?? {},
    depositedByUid: data.depositedByUid ?? "",
    depositedByName: data.depositedByName ?? "",
    depositedAt: iso(data.depositedAt) ?? new Date(0).toISOString(),
    credits: creditsOf(data),
  } as StashEntry;
};

const toLogEntry = (doc: DocumentSnapshot): StashLogEntry => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    action: data.action === "take" ? "take" : "deposit",
    uid: data.uid ?? "",
    displayName: data.displayName ?? "",
    itemName: data.itemName ?? "",
    rarity: data.rarity ?? "",
    at: iso(data.at) ?? new Date(0).toISOString(),
  };
};

/**
 * Give and take per member. Counted off the log rather than stored, so it can
 * never drift from the history it claims to summarise, and members who have
 * done neither still appear — an empty row is the point.
 */
const buildTallies = (
  members: GuildMember[],
  log: StashLogEntry[],
): StashTally[] => {
  const tallies = new Map<string, StashTally>(
    members.map((member) => [
      member.uid,
      {
        uid: member.uid,
        displayName: member.displayName,
        deposited: 0,
        taken: 0,
      },
    ]),
  );

  for (const entry of log) {
    const tally = tallies.get(entry.uid) ?? {
      uid: entry.uid,
      // Somebody who has since left still shows against what they moved.
      displayName: entry.displayName,
      deposited: 0,
      taken: 0,
    };
    if (entry.action === "deposit") tally.deposited++;
    else tally.taken++;
    tallies.set(entry.uid, tally);
  }

  return [...tallies.values()].sort(
    (a, b) =>
      b.deposited - a.deposited ||
      a.taken - b.taken ||
      a.displayName.localeCompare(b.displayName),
  );
};

export async function readStash(
  guildId: string,
  members: GuildMember[],
  /** The guild document, for the honor each member has to take with. */
  guildData?: Record<string, any>,
): Promise<GuildStash> {
  const [entries, logSnap] = await Promise.all([
    stashRef(guildId).limit(STASH_LIMIT).get(),
    logRef(guildId).orderBy("at", "desc").limit(LOG_LIMIT).get(),
  ]);

  const log = (logSnap.docs as DocumentSnapshot[]).map(toLogEntry);

  return {
    entries: (entries.docs as DocumentSnapshot[])
      .map(toEntry)
      .sort((a, b) => b.depositedAt.localeCompare(a.depositedAt)),
    log,
    tallies: buildTallies(members, log),
    honor: readHonor(guildData),
    partsFromShelf: (guildData?.[PARTS_FROM_SHELF] ?? {}) as Record<
      string,
      PartsFromShelf
    >,
  };
}

export type StashResult =
  | { ok: true }
  | { ok: false; status: 400 | 402 | 403 | 404 | 409 | 429; error: string };

const DETACH_MESSAGES: Record<string, string> = {
  "not-found": "You do not own that item",
  "not-enough": "You do not have that many",
  "no-definition": "That item is not in the game any more",
  "on-pedalboard": "Take it off the pedalboard first",
};

/**
 * Parts are the one thing on the shelf that stacks, so their entry is addressed
 * rather than auto-numbered: every Epic Pickup anybody leaves lands in the same
 * socket. A shelf that grew a fresh tile per handful of screws would bury the
 * gear the stash exists for.
 */
const partEntryId = (partId: string, tier: string) => `part-${partId}-${tier}`;

const millis = (value: any): number => value?.toMillis?.() ?? 0;

/**
 * What is on the shelf, newest first — the order `readStash` hands to the
 * client, so the rows counted here are the rows a member is looking at.
 */
const onShelfNewestFirst = (
  shelf: { docs: DocumentSnapshot[] } | null,
): { id: string; kind: StashItemKind }[] =>
  [...(shelf?.docs ?? [])]
    .sort(
      (a, b) => millis(b.data()?.depositedAt) - millis(a.data()?.depositedAt),
    )
    .map((doc) => ({
      id: doc.id,
      kind: (doc.data()?.kind ?? "guitar") as StashItemKind,
    }));

const detachFor = (
  data: Record<string, any>,
  request: StashDeposit,
):
  | { ok: true; detached: DetachedLoose }
  | { ok: false; problem: DetachProblem } => {
  if (request.kind === "part") {
    return detachPart(data, request.partId, request.tier, request.qty);
  }
  if (request.kind === "mod") return detachMod(data, request.modId);
  return detachItem(data, request.kind, request.inventoryItemId);
};

/** How many pieces a request names, for the log line. Gear and mods are one. */
const amountOf = (request: StashDeposit) =>
  request.kind === "part" ? Math.floor(Number(request.qty)) : 1;

/** "12× Epic Pickup" reads better in the log than a bare part name does. */
const logName = (name: string, qty: number) =>
  qty > 1 ? `${qty}× ${name}` : name;

/**
 * How many takes this member has already spent today, off the guild document.
 *
 * Stored as a day key and a count rather than reset by a scheduled job: a
 * count left over from yesterday reads as zero the moment `today` no longer
 * matches it, so nothing has to run at midnight to clear it.
 */
const takesToday = (
  guildData: Record<string, any>,
  uid: string,
  today: string,
): number => {
  const stored = (guildData.stashTakes ?? {})[uid] as
    | { day?: string; count?: number }
    | undefined;
  if (!stored || stored.day !== today) return 0;
  return Math.max(0, Math.floor(Number(stored.count) || 0));
};

/** Puts one of the member's items — gear, a rescued mod, or parts — on the shelf. */
export async function depositItem(
  session: PlayerSession,
  guildId: string,
  request: StashDeposit,
): Promise<StashResult> {
  const named =
    request.kind === "part"
      ? Boolean(request.partId && request.tier)
      : request.kind === "mod"
        ? Boolean(request.modId)
        : Boolean(request.inventoryItemId);
  if (!named) return { ok: false, status: 400, error: "Missing item" };

  const entryRef =
    request.kind === "part"
      ? stashRef(guildId).doc(partEntryId(request.partId, request.tier))
      : stashRef(guildId).doc();
  const historyRef = logRef(guildId).doc();

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    // Every read first: a transaction that writes before it reads is refused,
    // and a part deposit has to see the stack it is about to grow.
    const user = await tx.get(userRef(session.uid));
    const existing = request.kind === "part" ? await tx.get(entryRef) : null;

    // A stack landing on a socket that is already there costs no room, so only
    // a deposit that opens a new socket has to look at how big the shelf is.
    // The guild is read either way: it also holds what this member has taken
    // off the shelf, which earns nothing going back on.
    const opensASocket = !existing?.exists;
    const [guild, shelf] = await Promise.all([
      tx.get(guildRef(guildId)),
      // Two fields per entry: what it is, and when it landed. That is
      // everything the board needs to work out the shape it would draw.
      opensASocket
        ? tx.get(
            stashRef(guildId).select("kind", "depositedAt").limit(STASH_LIMIT),
          )
        : null,
    ]);

    if (user.data()?.guildId !== guildId) return "not-a-member" as const;

    if (
      opensASocket &&
      !shelfHasRoom(
        [
          // Newest first, which is the order the tab draws the shelf in — so
          // the piece is counted where it will actually hang.
          { id: entryRef.id, tall: request.kind === "guitar" },
          ...onShelfNewestFirst(shelf).map(shelfPiece),
        ],
        guildStashRowLimit(guild.data()?.stashUpgrades),
      )
    ) {
      return "full" as const;
    }

    const result = detachFor(user.data() ?? {}, request);
    if (!result.ok) return result.problem ?? "not-found";

    const { detached } = result;
    const moved = amountOf(request);

    // Pieces that came off this shelf go back on it as nobody's: they earned
    // their honor the first time they were left.
    const returning =
      request.kind === "part"
        ? Math.min(
            moved,
            partsFromShelfOf(
              guild.data() ?? {},
              session.uid,
              request.partId,
              request.tier,
            ),
          )
        : earnedHonorIn(detached.item, guildId)
          ? 1
          : 0;
    const earning = moved - returning;
    const honor =
      earning > 0 ? stashHonorValue(request.kind, detached.rarity, earning) : 0;

    const previous = existing?.exists ? creditsOf(existing.data() ?? {}) : {};
    const mine = previous[session.uid] ?? { qty: 0, honor: 0 };
    const credits =
      earning > 0
        ? {
            ...previous,
            [session.uid]: {
              qty: mine.qty + earning,
              honor: mine.honor + honor,
            },
          }
        : previous;

    // A stack lands on whatever is already there rather than beside it.
    const onShelf =
      request.kind === "part"
        ? ((existing?.data()?.item as ScrapPart | undefined)?.qty ?? 0)
        : 0;
    const item =
      request.kind === "part"
        ? { ...(detached.item as ScrapPart), qty: onShelf + moved }
        : detached.item;

    tx.update(userRef(session.uid), detached.userUpdate);
    tx.set(entryRef, {
      kind: request.kind,
      item,
      name: detached.name,
      rarity: detached.rarity,
      depositedByUid: session.uid,
      depositedByName: session.displayName,
      depositedAt: FieldValue.serverTimestamp(),
      credits,
    });
    tx.set(historyRef, {
      action: "deposit",
      uid: session.uid,
      displayName: session.displayName,
      itemName: logName(detached.name, moved),
      rarity: detached.rarity,
      at: FieldValue.serverTimestamp(),
    });
    // The receipt: what the piece is worth on the shelf, in honor, credited to
    // whoever left it — and kept on the entry in `credits`, which is what
    // taking it back hands back.
    const guildUpdate: Record<string, any> = {};
    if (honor > 0) {
      guildUpdate[`honor.${session.uid}.earned`] = FieldValue.increment(honor);
    }
    if (request.kind === "part" && returning > 0) {
      guildUpdate[
        `${PARTS_FROM_SHELF}.${session.uid}.${request.partId}.${request.tier}`
      ] = FieldValue.increment(-returning);
    }
    if (Object.keys(guildUpdate).length > 0) {
      tx.update(guildRef(guildId), guildUpdate);
    }

    return "ok" as const;
  });

  if (outcome === "not-a-member") {
    return { ok: false, status: 403, error: "You are not in this guild" };
  }
  if (outcome === "full") {
    return {
      ok: false,
      status: 409,
      error: "The shelf is full — the guild can chip in for another row",
    };
  }
  if (outcome !== "ok") {
    return {
      ok: false,
      status: outcome === "on-pedalboard" ? 409 : 404,
      error: DETACH_MESSAGES[outcome] ?? "Could not deposit that item",
    };
  }

  return { ok: true };
}

/**
 * Takes an entry off the shelf and into the member's arsenal, for honor.
 *
 * `qty` only means anything to a stack of parts, and it is clamped to what is
 * actually there: a shared pool of parts is only usable if a member can take
 * the eight screws their build wants without emptying the shelf, and only
 * honest if asking for more than exists hands over no more than exists.
 *
 * The price is `takePrice`: the member's own pieces come back for the honor
 * leaving them earned, anything else for the flat `TAKE_HONOR_COST` — never
 * the item's own value, see `guildHonor.utils.ts` for why. It is checked
 * against the balance on the stored guild document inside the same
 * transaction that moves the piece, so two takes racing for one balance are
 * settled by Firestore rather than by whoever's request arrived first.
 * `TAKE_DAILY_LIMIT` is checked the same way, off a per-member count also
 * stored on the guild document, and only for a take that pays the toll.
 */
export async function takeItem(
  session: PlayerSession,
  guildId: string,
  entryId: string,
  qty?: number,
): Promise<StashResult> {
  if (!entryId) return { ok: false, status: 400, error: "Missing item" };

  const entryRef = stashRef(guildId).doc(entryId);
  const historyRef = logRef(guildId).doc();
  const today = getServerDateKey();

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [user, entry, guild] = await Promise.all([
      tx.get(userRef(session.uid)),
      tx.get(entryRef),
      tx.get(guildRef(guildId)),
    ]);

    if (user.data()?.guildId !== guildId) return "not-a-member" as const;
    // Two members reaching for the same thing: whoever's transaction lands
    // first gets it, and the second finds an empty shelf rather than a copy.
    if (!entry.exists) return "gone" as const;

    const guildData = guild.data() ?? {};
    const data = entry.data() ?? {};
    const kind = (data.kind ?? "guitar") as StashItemKind;
    const owner = user.data() ?? {};
    let moved = 1;

    if (kind === "part") {
      const stack = (data.item ?? {}) as ScrapPart;
      const asked = Math.floor(Number(qty));
      const want =
        Number.isFinite(asked) && asked > 0
          ? Math.min(asked, stack.qty)
          : stack.qty;
      if (want <= 0) return "gone" as const;
      moved = want;
    }

    // The member's own pieces come back for what leaving them earned, anything
    // else for the flat toll — and all of it checked against the stored
    // balance before anything moves.
    const credits = creditsOf(data);
    const price = takePrice(credits[session.uid], moved);

    // Only a take that pays the toll counts against the day: taking back your
    // own moves nothing that was anybody else's.
    const takenToday = takesToday(guildData, session.uid, today);
    if (price.toll > 0 && takenToday >= TAKE_DAILY_LIMIT) {
      return { limited: true as const };
    }

    const { balance } = honorFor(guildData, session.uid);
    if (balance < price.total) {
      return {
        poor: true as const,
        cost: price.total,
        balance,
        reclaim: price.refund > 0,
      };
    }

    if (kind === "part") {
      const stack = (data.item ?? {}) as ScrapPart;
      tx.update(
        userRef(session.uid),
        attachPart(owner, { ...stack, qty: moved }),
      );
      // What is left stays on the shelf under the same id, so the socket does
      // not move out from under whoever is looking at it.
      if (moved < stack.qty) {
        const { [session.uid]: mine, ...others } = credits;
        const stillLeft = (mine?.qty ?? 0) - price.own;
        tx.update(entryRef, {
          "item.qty": stack.qty - moved,
          credits:
            mine && stillLeft > 0
              ? {
                  ...others,
                  [session.uid]: {
                    qty: stillLeft,
                    honor: mine.honor - price.refund,
                  },
                }
              : others,
        });
      } else tx.delete(entryRef);
    } else {
      // Handed to anybody but the member who left it, the piece remembers this
      // shelf: its honor here has been paid out, and leaving it again earns
      // nothing. Taken back by its depositor it is the deposit undone, and
      // comes back exactly as it went on.
      const item =
        price.own > 0
          ? (data.item ?? {})
          : markHonorEarned(data.item ?? {}, guildId);
      tx.update(
        userRef(session.uid),
        kind === "mod" ? attachMod(owner, item) : attachItem(owner, kind, item),
      );
      tx.delete(entryRef);
    }

    tx.set(historyRef, {
      action: "take",
      uid: session.uid,
      displayName: session.displayName,
      itemName: logName(data.name ?? "", moved),
      rarity: data.rarity ?? "",
      at: FieldValue.serverTimestamp(),
    });

    const guildUpdate: Record<string, any> = {};
    if (price.refund > 0) {
      // Off what the member earned rather than onto what they spent: the
      // roster ranks by earned, and a piece taken straight back was never given.
      guildUpdate[`honor.${session.uid}.earned`] = FieldValue.increment(
        -price.refund,
      );
    }
    if (price.toll > 0) {
      guildUpdate[`honor.${session.uid}.spent`] = FieldValue.increment(
        price.toll,
      );
      guildUpdate[`stashTakes.${session.uid}`] = {
        day: today,
        count: takenToday + 1,
      };
    }
    if (kind === "part" && moved > price.own) {
      const stack = data.item as ScrapPart;
      guildUpdate[
        `${PARTS_FROM_SHELF}.${session.uid}.${stack.partId}.${stack.tier}`
      ] = FieldValue.increment(moved - price.own);
    }
    if (Object.keys(guildUpdate).length > 0) {
      tx.update(guildRef(guildId), guildUpdate);
    }

    return "ok" as const;
  });

  if (outcome === "not-a-member") {
    return { ok: false, status: 403, error: "You are not in this guild" };
  }
  if (outcome === "gone") {
    return { ok: false, status: 404, error: "Somebody got there first" };
  }
  if (typeof outcome === "object" && "limited" in outcome) {
    return {
      ok: false,
      status: 429,
      error: `You have already taken ${TAKE_DAILY_LIMIT} things off the shelf today — come back tomorrow`,
    };
  }
  if (typeof outcome === "object") {
    return {
      ok: false,
      status: 402,
      error: outcome.reclaim
        ? `Taking back what you left returns the honor it earned you — that is ${outcome.cost} and you have ${outcome.balance}`
        : `That takes ${outcome.cost} honor and you have ${outcome.balance} — put something into the guild first`,
    };
  }

  return { ok: true };
}
