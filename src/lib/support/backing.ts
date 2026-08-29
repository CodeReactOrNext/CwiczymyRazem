import type { Backer } from "feature/supporterPanel/types/supporterPanel.types";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { chargeTokens, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Spending tokens to push something up a board.
 *
 * Shared by the roadmap and the gear proposals because it is the same deal in
 * both places — charge the wallet, respect the per-item ceiling, move two
 * counters — and two copies of a money path is one copy too many.
 */

export type BackOutcome = "ok" | "missing" | "capped" | "broke";

export interface BackingRefs {
  /** The thing being backed. Must carry `voteCount` and `backerCount`. */
  item: DocumentReference;
  /** The backer's ledger: one document holding `votes: { itemId: weight }`. */
  ledger: DocumentReference;
}

export async function backWithTokens(params: {
  uid: string;
  itemId: string;
  refs: BackingRefs;
  amount: number;
  cap: number;
  costPerPoint: number;
  /** Stamped onto the ledger so a board read can name the backer in one query. */
  backer: { name: string; avatar: string | null };
}): Promise<BackOutcome> {
  const { uid, itemId, refs, amount, cap, costPerPoint, backer } = params;

  return firestore.runTransaction(async (tx: Transaction) => {
    const item = await tx.get(refs.item);
    if (!item.exists) return "missing";

    const ledger = await tx.get(refs.ledger);
    const user = await tx.get(userRef(uid));

    const mine = (ledger.data()?.votes ?? {}) as Record<string, number>;
    const already = Math.max(0, mine[itemId] ?? 0);

    if (already + amount > cap) return "capped";
    if (!chargeTokens(tx, user, amount * costPerPoint)) return "broke";

    tx.set(
      refs.ledger,
      {
        name: backer.name,
        avatar: backer.avatar,
        votes: { ...mine, [itemId]: already + amount },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.update(refs.item, {
      voteCount: FieldValue.increment(amount),
      // Backers are people, not weight: only the first token counts a person.
      backerCount: FieldValue.increment(already === 0 ? 1 : 0),
    });

    return "ok";
  });
}

/**
 * How many ledgers one board read pulls in. Comfortably past the supporter
 * roll; the reader's own ledger is fetched separately so their budget is never
 * the thing this ceiling truncates.
 */
const LEDGER_LIMIT = 500;

/** How many user documents one `getAll` is handed. */
const LOOKUP_CHUNK = 200;

interface Ledger {
  uid: string;
  /** Cached at write time. Null on a ledger written before names were cached. */
  name: string | null;
  avatar: string | null;
  votes: Record<string, number>;
}

export interface BoardBacking {
  /** itemId → everyone behind it, heaviest backing first. */
  byItem: Record<string, Backer[]>;
  /** itemId → what the reader themself has already burned onto it. */
  mine: Record<string, number>;
}

const votesOf = (data: Record<string, unknown> | undefined) =>
  (data?.votes ?? {}) as Record<string, number>;

const toLedger = (doc: DocumentSnapshot): Ledger => {
  const data = doc.data();
  return {
    uid: doc.id,
    name: typeof data?.name === "string" && data.name ? data.name : null,
    avatar: typeof data?.avatar === "string" ? data.avatar : null,
    votes: votesOf(data),
  };
};

/**
 * Names the backers whose ledger predates the cached name. Every later vote
 * writes the name onto the ledger, so this shrinks to nothing on its own
 * instead of growing with the board.
 */
const lookupNames = async (
  uids: string[],
): Promise<Map<string, { name: string; avatar: string | null }>> => {
  const found = new Map<string, { name: string; avatar: string | null }>();

  const chunks: string[][] = [];
  for (let from = 0; from < uids.length; from += LOOKUP_CHUNK) {
    chunks.push(uids.slice(from, from + LOOKUP_CHUNK));
  }

  const batches: DocumentSnapshot[][] = await Promise.all(
    chunks.map((chunk) => firestore.getAll(...chunk.map(userRef))),
  );

  for (const docs of batches) {
    for (const doc of docs) {
      const data = doc.data();
      if (!data) continue;
      found.set(doc.id, {
        name: data.displayName ?? "Supporter",
        avatar: data.avatar ?? null,
      });
    }
  }

  return found;
};

/**
 * Reads a whole vote ledger and turns it inside out: stored per backer, read
 * per item.
 *
 * The reverse map is built here rather than kept on the item because the ledger
 * is the only copy that cannot drift — a denormalised list would have missed
 * every vote cast before it existed, and would keep showing whatever name
 * somebody had on the day they voted.
 */
export async function readBoardBacking(
  collection: string,
  uid: string,
): Promise<BoardBacking> {
  const ledgers = firestore.collection(collection).limit(LEDGER_LIMIT).get();
  const own = firestore.collection(collection).doc(uid).get();
  const [snap, mineDoc] = await Promise.all([ledgers, own]);

  const rows = (snap.docs as DocumentSnapshot[]).map(toLedger);
  const named = await lookupNames(
    rows.filter((row) => !row.name).map((row) => row.uid),
  );

  const byItem: Record<string, Backer[]> = {};

  for (const row of rows) {
    const fallback = named.get(row.uid);

    for (const [itemId, weight] of Object.entries(row.votes)) {
      if (!Number.isFinite(weight) || weight <= 0) continue;

      byItem[itemId] = byItem[itemId] ?? [];
      byItem[itemId].push({
        uid: row.uid,
        name: row.name ?? fallback?.name ?? "Supporter",
        avatar: row.avatar ?? fallback?.avatar ?? null,
        weight,
      });
    }
  }

  for (const backers of Object.values(byItem)) {
    backers.sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  }

  return { byItem, mine: votesOf(mineDoc.data()) };
}

/** Turns an outcome into the answer an API route should give. */
export const backingError = (
  outcome: Exclude<BackOutcome, "ok">,
  cap: number,
  missing: string,
): { status: 400 | 402 | 404; error: string } => {
  if (outcome === "missing") return { status: 404, error: missing };
  if (outcome === "capped") {
    return {
      status: 400,
      error: `One person can back this ${cap} times at most`,
    };
  }
  return { status: 402, error: "Not enough tokens left" };
};
