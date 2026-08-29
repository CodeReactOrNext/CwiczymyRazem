import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import type {
  EffectDefinition,
  GuitarDefinition,
} from "feature/arsenal/types/arsenal.types";
import { mulberry32 } from "feature/arsenal/utils/seededRandom";
import type {
  ItemKey,
  SeatTallies,
  SlateRarity,
  SupporterCaseState,
} from "feature/supporterCase/types/supporterCase.types";
import { SLATE_RARITIES } from "feature/supporterCase/types/supporterCase.types";
import {
  cycleEnd,
  cycleIdOf,
  cycleStart,
  daysLeftInCycle,
  nextCycleId,
} from "feature/supporterCase/utils/caseCycle";
import {
  carryOverSeats,
  combineTallies,
  eligibleItems,
  findItem,
  isEligibleFor,
  isSlateRarity,
  rankCandidates,
  winnerOf,
} from "feature/supporterCase/utils/slate";
import { SLATE_VOTE_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { SupporterSession } from "lib/support/supporterAuth";
import { chargeTokens, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The supporter case: six items, one per rarity, voted onto the slate for a
 * fortnight at a time.
 *
 * The slot-per-rarity shape is the balance. Whatever a fortnight of voting
 * does, the case comes out with exactly one Common, one Uncommon, one Rare, one
 * Epic, one Legendary and one Mythic — a well-organised group cannot stack it
 * into six Mythics, because there is only ever one Mythic seat to win. What the
 * vote decides is *which* item sits in each seat, never how good the case is.
 *
 * ─── Why a ballot has two halves ────────────────────────────────────────────
 *
 * A vote that loses is not a vote that is spent. When a slate resolves, only
 * the item that took each seat has its tally cleared — its backers got the
 * fortnight they paid for. Everything behind it rolls into the next ballot as
 * `carried`, kept apart from that ballot's own `tallies` for two reasons:
 *
 *   - it is idempotent. The carry-over is an absolute value computed from a
 *     ballot that can no longer change, so writing it twice — a retried
 *     transaction, two requests racing through the rollover — lands on exactly
 *     the same numbers. Incrementing the live tally instead would double-count.
 *   - the panel can show the split, which is the whole point of the rule: a
 *     supporter can see the token they spent last fortnight still standing.
 *
 * Everything that reads a tally therefore has to add the two halves back
 * together, which is what `combineTallies` is for.
 */

const SLATES_COLLECTION = "supporterCaseSlates";
const BALLOTS_COLLECTION = "supporterCaseBallots";

const slateRef = (cycleId: string): DocumentReference =>
  firestore.collection(SLATES_COLLECTION).doc(cycleId);

const ballotRef = (cycleId: string): DocumentReference =>
  firestore.collection(BALLOTS_COLLECTION).doc(cycleId);

/** One ballot document, as stored. */
interface BallotDoc {
  /** Votes cast into this ballot during its own fortnight. */
  tallies?: SeatTallies;
  /** Losers of the slate before it, rolled forward. */
  carried?: SeatTallies;
  /** Who cast what, for the "you N" the panel shows. */
  voters?: Record<string, SeatTallies>;
  /** Who is owed what out of `carried`. */
  carriedVoters?: Record<string, SeatTallies>;
}

/** Stable numeric seed from a cycle id, for the deterministic fallback pick. */
const seedOf = (cycleId: string): number => {
  let seed = 0;
  for (const char of cycleId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return seed;
};

export type Slate = Record<SlateRarity, ItemKey>;

/** Deterministic stand-in when a seat drew no votes. */
function fallbackFor(rarity: SlateRarity, cycleId: string): ItemKey {
  const pool = eligibleItems(rarity);
  const random = mulberry32(seedOf(`${cycleId}:${rarity}`));
  return pool[Math.floor(random() * pool.length)]?.key ?? pool[0]?.key ?? "";
}

/** A ballot's real standings: this fortnight's votes plus the carry-over. */
const standingsOf = (ballot: BallotDoc | undefined): SeatTallies => {
  const seats: SeatTallies = {};

  for (const rarity of SLATE_RARITIES) {
    const combined = combineTallies(
      ballot?.tallies?.[rarity],
      ballot?.carried?.[rarity],
    );
    if (Object.keys(combined).length > 0) seats[rarity] = combined;
  }

  return seats;
};

/** The same sum per supporter, so a carried token stays with whoever spent it. */
const standingsByVoter = (
  ballot: BallotDoc | undefined,
): Record<string, SeatTallies> => {
  const uids = new Set([
    ...Object.keys(ballot?.voters ?? {}),
    ...Object.keys(ballot?.carriedVoters ?? {}),
  ]);

  const byVoter: Record<string, SeatTallies> = {};

  for (const uid of uids) {
    const seats = standingsOf({
      tallies: ballot?.voters?.[uid],
      carried: ballot?.carriedVoters?.[uid],
    });
    if (Object.keys(seats).length > 0) byVoter[uid] = seats;
  }

  return byVoter;
};

/**
 * Resolving one ballot: who takes each seat, and what the slate ends up being.
 *
 * `winners` holds only the seats the vote actually decided — a seat nobody
 * backed resolves to null there and to a deterministic draw in the slate, and
 * the distinction matters because only a voted winner has a tally to clear.
 */
const resolveBallot = (seats: SeatTallies, cycleId: string) => {
  const slate = {} as Slate;
  const winners: Partial<Record<SlateRarity, ItemKey | null>> = {};

  for (const rarity of SLATE_RARITIES) {
    const winner = winnerOf(seats[rarity], rarity);
    winners[rarity] = winner;
    slate[rarity] = winner ?? fallbackFor(rarity, cycleId);
  }

  return { slate, winners };
};

/**
 * The slate for the running cycle, opening it if this is the first read since
 * the rollover. Lazy, like every other rotation here — no cron to keep alive.
 *
 * A slot nobody voted for is filled by a deterministic draw seeded on the cycle
 * id, so the case is never short an item and every caller (the panel, the shop,
 * the draw itself) computes the identical slate.
 *
 * Opening a slate also settles the ballot behind it: the winners' tallies are
 * spent, everything else is carried into the ballot now taking votes. Both
 * writes go in one batch, so a slate can never open without its losers being
 * paid forward.
 *
 * The one gap is a cycle nobody looks at from end to end — no case opened, no
 * panel loaded, a full fortnight. Its ballot then never settles and its losing
 * tokens stop there. Two reads in two weeks is a low enough bar that guarding
 * against it would cost more than it saves.
 */
export async function ensureCurrentSlate(
  now: Date = new Date(),
): Promise<Slate> {
  const cycleId = cycleIdOf(now);
  const existing = await slateRef(cycleId).get();

  if (existing.exists) {
    const stored = (existing.data()?.slate ?? {}) as Partial<Slate>;
    // A stored key that no longer names a real item — an item retired between
    // cycles, or a seat that did not exist when the slate opened — must not
    // leave the case short.
    const repaired = {} as Slate;
    let broken = false;

    for (const rarity of SLATE_RARITIES) {
      const key = stored[rarity];
      if (key && isEligibleFor(key, rarity)) {
        repaired[rarity] = key;
      } else {
        broken = true;
        repaired[rarity] = fallbackFor(rarity, cycleId);
      }
    }

    if (broken)
      await slateRef(cycleId).set({ slate: repaired }, { merge: true });
    return repaired;
  }

  const ballot = (await ballotRef(cycleId).get()).data() as
    | BallotDoc
    | undefined;

  const seats = standingsOf(ballot);
  const { slate, winners } = resolveBallot(seats, cycleId);

  const carriedVoters: Record<string, SeatTallies> = {};
  for (const [uid, voterSeats] of Object.entries(standingsByVoter(ballot))) {
    const kept = carryOverSeats(voterSeats, winners);
    if (Object.keys(kept).length > 0) carriedVoters[uid] = kept;
  }

  const batch = firestore.batch();

  batch.set(
    slateRef(cycleId),
    { slate, openedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  // `mergeFields` rather than a plain merge: the carry-over is replaced whole
  // rather than deep-merged, so a re-run can never leave a stale key behind,
  // and the votes already cast into this ballot are left untouched.
  batch.set(
    ballotRef(nextCycleId(now)),
    {
      carried: carryOverSeats(seats, winners),
      carriedVoters,
      carriedFrom: cycleId,
    },
    { mergeFields: ["carried", "carriedVoters", "carriedFrom"] },
  );

  await batch.commit();

  return slate;
}

export type SlatePoolEntry =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition };

/**
 * The slate as real item definitions — what the case actually draws from.
 * Shaped like the Featured case's pool so the draw can treat them alike.
 */
export async function getSlatePool(
  now: Date = new Date(),
): Promise<SlatePoolEntry[]> {
  const slate = await ensureCurrentSlate(now);
  const pool: SlatePoolEntry[] = [];

  for (const rarity of SLATE_RARITIES) {
    const item = findItem(slate[rarity]);
    if (!item) continue;

    if (item.kind === "guitar") {
      const def = GUITAR_DEFINITIONS.find((g) => g.id === item.id);
      if (def) pool.push({ kind: "guitar", def });
    } else {
      const def = EFFECT_DEFINITIONS.find((e) => e.id === item.id);
      if (def) pool.push({ kind: "effect", def });
    }
  }

  return pool;
}

export async function readState(
  uid: string,
  isSupporter: boolean,
  now: Date = new Date(),
): Promise<SupporterCaseState> {
  const ballotCycleId = nextCycleId(now);

  const [slate, ballot] = await Promise.all([
    ensureCurrentSlate(now),
    ballotRef(ballotCycleId).get(),
  ]);

  const data = ballot.data() as BallotDoc | undefined;

  const slots = SLATE_RARITIES.map((rarity) => ({
    rarity,
    current: findItem(slate[rarity]),
    candidates: rankCandidates(
      {
        fresh: data?.tallies?.[rarity],
        carried: data?.carried?.[rarity],
        mine: data?.voters?.[uid]?.[rarity],
        myCarried: data?.carriedVoters?.[uid]?.[rarity],
      },
      rarity,
    ),
  }));

  // Counted off the ranked rows, so an item retired between cycles drops out of
  // the total the same way it drops off the ballot.
  const myTokens = slots.reduce(
    (sum, slot) =>
      sum +
      slot.candidates.reduce((seat, candidate) => seat + candidate.mine, 0),
    0,
  );

  return {
    cycleId: cycleIdOf(now),
    ballotCycleId,
    startsAt: cycleStart(now).toISOString(),
    endsAt: cycleEnd(now).toISOString(),
    daysLeft: daysLeftInCycle(now),
    fameCost: CASE_DEFINITIONS.supporter?.fameCost ?? 0,
    slots,
    myTokens,
    isSupporter,
  };
}

export type SlateResult =
  | { ok: true; state: SupporterCaseState }
  | { ok: false; status: 400 | 402; error: string };

/**
 * Burns a token onto one item for one seat of the next slate. The rarity has to
 * match the item's own — a Rare cannot be voted into the Mythic seat, which is
 * what keeps the case's composition fixed no matter how the vote goes.
 *
 * Only `tallies` is ever incremented here. The carry-over sits in its own field
 * and is written once, when the slate opens.
 */
export async function voteForItem(
  session: SupporterSession,
  rarity: string,
  key: ItemKey,
  now: Date = new Date(),
): Promise<SlateResult> {
  if (!isSlateRarity(rarity)) {
    return { ok: false, status: 400, error: "No such slot" };
  }
  if (!isEligibleFor(key, rarity)) {
    return {
      ok: false,
      status: 400,
      error: "That item does not belong in this slot",
    };
  }

  const cycleId = nextCycleId(now);

  const charged = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    if (!chargeTokens(tx, user, SLATE_VOTE_COST)) return false;

    tx.set(
      ballotRef(cycleId),
      {
        tallies: { [rarity]: { [key]: FieldValue.increment(SLATE_VOTE_COST) } },
        voters: {
          [session.uid]: {
            [rarity]: { [key]: FieldValue.increment(SLATE_VOTE_COST) },
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  });

  if (!charged) {
    return {
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    };
  }

  return { ok: true, state: await readState(session.uid, true, now) };
}
