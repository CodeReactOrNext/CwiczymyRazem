import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  GuildStash,
  StashDeposit,
  StashEntry,
  StashItemKind,
  StashLogEntry,
  StashTally,
} from "feature/guilds/types/stash.types";
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
 */

const GUILDS = "guilds";
const STASH = "stash";
const LOG = "stashLog";

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
  };
}

export type StashResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

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
    const opensASocket = !existing?.exists;
    const [guild, shelf] = opensASocket
      ? await Promise.all([
          tx.get(guildRef(guildId)),
          // Two fields per entry: what it is, and when it landed. That is
          // everything the board needs to work out the shape it would draw.
          tx.get(
            stashRef(guildId).select("kind", "depositedAt").limit(STASH_LIMIT),
          ),
        ])
      : [null, null];

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
        guildStashRowLimit(guild?.data()?.stashUpgrades),
      )
    ) {
      return "full" as const;
    }

    const result = detachFor(user.data() ?? {}, request);
    if (!result.ok) return result.problem ?? "not-found";

    const { detached } = result;
    const moved = amountOf(request);

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
    });
    tx.set(historyRef, {
      action: "deposit",
      uid: session.uid,
      displayName: session.displayName,
      itemName: logName(detached.name, moved),
      rarity: detached.rarity,
      at: FieldValue.serverTimestamp(),
    });

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
 * Takes an entry off the shelf and into the member's arsenal.
 *
 * `qty` only means anything to a stack of parts, and it is clamped to what is
 * actually there: a shared pool of parts is only usable if a member can take
 * the eight screws their build wants without emptying the shelf, and only
 * honest if asking for more than exists hands over no more than exists.
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

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [user, entry] = await Promise.all([
      tx.get(userRef(session.uid)),
      tx.get(entryRef),
    ]);

    if (user.data()?.guildId !== guildId) return "not-a-member" as const;
    // Two members reaching for the same thing: whoever's transaction lands
    // first gets it, and the second finds an empty shelf rather than a copy.
    if (!entry.exists) return "gone" as const;

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
      tx.update(
        userRef(session.uid),
        attachPart(owner, { ...stack, qty: want }),
      );
      // What is left stays on the shelf under the same id, so the socket does
      // not move out from under whoever is looking at it.
      if (want < stack.qty)
        tx.update(entryRef, { "item.qty": stack.qty - want });
      else tx.delete(entryRef);
    } else if (kind === "mod") {
      tx.update(userRef(session.uid), attachMod(owner, data.item ?? {}));
      tx.delete(entryRef);
    } else {
      tx.update(userRef(session.uid), attachItem(owner, kind, data.item ?? {}));
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

    return "ok" as const;
  });

  if (outcome === "not-a-member") {
    return { ok: false, status: 403, error: "You are not in this guild" };
  }
  if (outcome === "gone") {
    return { ok: false, status: 404, error: "Somebody got there first" };
  }

  return { ok: true };
}
