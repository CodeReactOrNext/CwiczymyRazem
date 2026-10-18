import { drawDuelExercise, getDuelExercise } from "feature/duels/data/duelPool";
import type {
  DuelDoc,
  DuelFeedEntry,
  DuelJoinResult,
  DuelOverview,
  DuelPlayer,
  DuelProfile,
  DuelRankingEntry,
  DuelReadyResult,
  DuelRunResult,
  DuelRunSubmission,
  DuelTicket,
  DuelView,
} from "feature/duels/types/duel.types";
import {
  canOpenDuel,
  canPlayerRun,
  DUEL_DURATION_MS,
  DUEL_FEED_SIZE,
  DUEL_MIN_LVL,
  DUEL_RANKING_SIZE,
  DUEL_REMIND_BEFORE_MS,
  DUEL_START_RATING,
  DUEL_SUBMIT_GRACE_MS,
  DUEL_TICKET_TTL_MS,
  feedForViewer,
  isEveryoneReady,
  liveTickets,
  pickOpponentTicket,
  readyRefusal,
  settledProfileUpdate,
  settleDuel,
  toDuelFeedEntry,
  toDuelView,
} from "feature/duels/utils/duelRules";
import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { buildDuelResultLog, duelResultLogId } from "lib/duels/duelResultLog";
import { buildDuelWaitingLog, duelWaitingLogId } from "lib/duels/duelWaitingLog";
import { firestore } from "utils/firebase/api/firebase.config";

const duels =(): CollectionReference => firestore.collection("duels");
const queue = (): CollectionReference => firestore.collection("duelQueue");
const profiles = (): CollectionReference =>
  firestore.collection("duelProfiles");

/** The feed's "someone is waiting" row for a ticket — lives exactly as long as the ticket. */
const waitingLog = (ticketId: string): DocumentReference =>
  firestore
    .collection("logs")
    .doc(duelWaitingLogId(ticketId)) as DocumentReference;

/** How far down the queue a join looks for somebody to pair with. */
const QUEUE_SCAN = 50;
/** How many due duels / tickets one cron run works through. */
const CRON_BATCH = 50;

export type DuelErrorCode =
  | "LOCKED"
  | "LIMIT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CLOSED"
  | "NO_RUN";

export class DuelError extends Error {
  constructor(public readonly code: DuelErrorCode) {
    super(code);
  }
}

/** Who a player is, as a duel stores them — read fresh on every join. */
export interface DuelIdentity {
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
}

export const readDuelIdentity = async (
  userId: string,
): Promise<DuelIdentity & { isAdmin: boolean }> => {
  const snap: DocumentSnapshot = await firestore
    .collection("users")
    .doc(userId)
    .get();
  const user = snap.data() ?? {};
  return {
    userId,
    displayName: user.displayName || "Anonymous",
    avatar: user.avatar || "",
    lvl: user.statistics?.lvl ?? 1,
    isAdmin: user.role === "admin",
  };
};

const emptyProfile = (identity: DuelIdentity, now: number): DuelProfile => ({
  ...identity,
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  tickets: [],
  active: [],
  recentDuelIds: [],
  updatedAt: now,
});

const readProfile = (snap: DocumentSnapshot): DuelProfile | null =>
  snap.exists ? (snap.data() as DuelProfile) : null;

const newPlayer = (profile: DuelProfile): DuelPlayer => ({
  userId: profile.userId,
  displayName: profile.displayName,
  avatar: profile.avatar,
  lvl: profile.lvl,
  ratingBefore: profile.rating ?? DUEL_START_RATING,
  playedBefore: profile.played ?? 0,
  bestScore: 0,
  bestAccuracy: 0,
  bestBpm: null,
  attempts: 0,
  lastAttemptAt: null,
});

const notify = (tx: Transaction, payload: Record<string, unknown>) => {
  tx.set(firestore.collection("notifications").doc() as DocumentReference, {
    ...payload,
    isRead: false,
    timestamp: FieldValue.serverTimestamp(),
  });
};

// ── Joining ──────────────────────────────────────────────────────────────────

/**
 * Puts the player in a duel: paired at once with the oldest ticket still
 * waiting, or queued as a ticket of their own when there is nobody to pair
 * with. One transaction, so two players racing for the same ticket can't both
 * get it — the loser of the race is retried and finds the next one.
 */
export async function joinDuelQueue(
  player: DuelIdentity & { isAdmin?: boolean },
  now: number = Date.now(),
): Promise<DuelJoinResult> {
  if (player.lvl < DUEL_MIN_LVL && !player.isAdmin)
    throw new DuelError("LOCKED");
  // Only these four fields are stored — never the admin flag.
  const identity: DuelIdentity = {
    userId: player.userId,
    displayName: player.displayName,
    avatar: player.avatar,
    lvl: player.lvl,
  };
  const { userId } = identity;
  const profileRef = profiles().doc(userId) as DocumentReference;

  return firestore.runTransaction(
    async (tx: Transaction): Promise<DuelJoinResult> => {
      const profileSnap = await tx.get(profileRef);
      const stored = readProfile(profileSnap);
      const profile: DuelProfile = {
        ...(stored ?? emptyProfile(identity, now)),
        ...identity,
      };
      if (!canOpenDuel(profile, now)) throw new DuelError("LIMIT");

      const waitingSnap = await tx.get(
        queue().orderBy("createdAt", "asc").limit(QUEUE_SCAN),
      );
      const waiting = waitingSnap.docs.map(
        (doc: QueryDocumentSnapshot) => doc.data() as DuelTicket,
      );
      const busyWith = new Set(
        (profile.active ?? []).map((entry) => entry.opponentId),
      );
      const ticket = pickOpponentTicket(waiting, userId, busyWith, now);

      const myTickets = liveTickets(profile.tickets ?? [], now);
      const identityFields = { ...identity };

      if (!ticket) {
        const ticketRef = queue().doc() as DocumentReference;
        const newTicket: DuelTicket = {
          id: ticketRef.id,
          userId,
          createdAt: now,
          expiresAt: now + DUEL_TICKET_TTL_MS,
        };
        tx.set(ticketRef, newTicket);
        tx.set(waitingLog(newTicket.id), buildDuelWaitingLog(newTicket));
        tx.set(
          profileRef,
          {
            ...(stored ? {} : emptyProfile(identity, now)),
            ...identityFields,
            tickets: [
              ...myTickets,
              {
                id: newTicket.id,
                createdAt: newTicket.createdAt,
                expiresAt: newTicket.expiresAt,
              },
            ],
            updatedAt: now,
          },
          { merge: true },
        );
        return { kind: "queued", ticketId: newTicket.id };
      }

      const opponentRef = profiles().doc(ticket.userId) as DocumentReference;
      const opponentSnap = await tx.get(opponentRef);
      const opponent =
        readProfile(opponentSnap) ??
        emptyProfile(
          {
            userId: ticket.userId,
            displayName: "Anonymous",
            avatar: "",
            lvl: 1,
          },
          now,
        );

      const exercise = drawDuelExercise();
      const duelRef = duels().doc() as DocumentReference;
      const endsAt = now + DUEL_DURATION_MS;
      const duel: DuelDoc = {
        id: duelRef.id,
        exerciseId: exercise.id,
        status: "active",
        createdAt: now,
        endsAt,
        settleAt: endsAt + DUEL_SUBMIT_GRACE_MS,
        remindAt: endsAt - DUEL_REMIND_BEFORE_MS,
        // The one who waited first.
        playerIds: [ticket.userId, userId],
        players: {
          [ticket.userId]: newPlayer(opponent),
          [userId]: newPlayer(profile),
        },
      };

      tx.set(duelRef, duel);
      tx.delete(queue().doc(ticket.id) as DocumentReference);
      tx.delete(waitingLog(ticket.id));
      tx.set(
        opponentRef,
        {
          ...(opponentSnap.exists ? {} : opponent),
          tickets: (opponent.tickets ?? []).filter(
            (entry) => entry.id !== ticket.id,
          ),
          active: [
            ...(opponent.active ?? []),
            { duelId: duel.id, opponentId: userId, endsAt },
          ],
          updatedAt: now,
        },
        { merge: true },
      );
      tx.set(
        profileRef,
        {
          ...(stored ? {} : emptyProfile(identity, now)),
          ...identityFields,
          tickets: myTickets,
          active: [
            ...(profile.active ?? []),
            { duelId: duel.id, opponentId: ticket.userId, endsAt },
          ],
          updatedAt: now,
        },
        { merge: true },
      );
      // The one who joined is looking at the page; the one who waited is not.
      notify(tx, {
        userId: ticket.userId,
        type: "duel_matched",
        duelId: duel.id,
        exerciseTitle: exercise.title,
      });
      return { kind: "matched", duelId: duel.id };
    },
  );
}

/** Takes a waiting ticket back. False when it was paired (or swept) first. */
export async function cancelDuelTicket(
  userId: string,
  ticketId: string,
  now: number = Date.now(),
): Promise<boolean> {
  const ticketRef = queue().doc(ticketId) as DocumentReference;
  const profileRef = profiles().doc(userId) as DocumentReference;
  return firestore.runTransaction(async (tx: Transaction) => {
    const [ticketSnap, profileSnap] = await Promise.all([
      tx.get(ticketRef),
      tx.get(profileRef),
    ]);
    const profile = readProfile(profileSnap);
    const ticket = ticketSnap.exists ? (ticketSnap.data() as DuelTicket) : null;
    if (ticket && ticket.userId !== userId) throw new DuelError("FORBIDDEN");
    if (ticket) {
      tx.delete(ticketRef);
      tx.delete(waitingLog(ticketId));
    }
    if (profile) {
      tx.update(profileRef, {
        tickets: liveTickets(profile.tickets ?? [], now).filter(
          (entry) => entry.id !== ticketId,
        ),
        updatedAt: now,
      });
    }
    return !!ticket;
  });
}

// ── Runs ─────────────────────────────────────────────────────────────────────

/**
 * Books one scored run of a duel session: always an attempt, and the new best
 * when it beats the old one. A player who pressed Ready sends no more.
 */
export async function submitDuelRun(
  userId: string,
  run: DuelRunSubmission,
  now: number = Date.now(),
): Promise<DuelRunResult> {
  const duelRef = duels().doc(run.duelId) as DocumentReference;
  return firestore.runTransaction(
    async (tx: Transaction): Promise<DuelRunResult> => {
      const snap = await tx.get(duelRef);
      if (!snap.exists) throw new DuelError("NOT_FOUND");
      const duel = snap.data() as DuelDoc;
      const me = duel.players[userId];
      if (!me || !duel.playerIds.includes(userId))
        throw new DuelError("FORBIDDEN");
      if (!canPlayerRun(duel, userId, now)) throw new DuelError("CLOSED");

      const score = Math.max(0, Math.round(run.score));
      const isNewBest = score > me.bestScore;
      const attempts = me.attempts + 1;
      const key = `players.${userId}`;
      tx.update(duelRef, {
        [`${key}.attempts`]: attempts,
        [`${key}.lastAttemptAt`]: now,
        ...(isNewBest
          ? {
              [`${key}.bestScore`]: score,
              [`${key}.bestAccuracy`]: Math.max(
                0,
                Math.min(100, Math.round(run.accuracy)),
              ),
              [`${key}.bestBpm`]: Number.isFinite(run.bpm)
                ? Math.round(run.bpm!)
                : null,
            }
          : {}),
      });
      return {
        attempts,
        bestScore: isNewBest ? score : me.bestScore,
        isNewBest,
      };
    },
  );
}

// ── Cron: expiry, reminders, settlement ──────────────────────────────────────

/** Drops one expired ticket from the queue and from its owner's profile. */
async function expireTicket(ticketId: string, now: number): Promise<void> {
  const ticketRef = queue().doc(ticketId) as DocumentReference;
  await firestore.runTransaction(async (tx: Transaction) => {
    const ticketSnap = await tx.get(ticketRef);
    if (!ticketSnap.exists) return;
    const ticket = ticketSnap.data() as DuelTicket;
    if (ticket.expiresAt > now) return;
    const profileRef = profiles().doc(ticket.userId) as DocumentReference;
    const profile = readProfile(await tx.get(profileRef));
    tx.delete(ticketRef);
    tx.delete(waitingLog(ticketId));
    if (profile) {
      tx.update(profileRef, {
        tickets: liveTickets(profile.tickets ?? [], now).filter(
          (entry) => entry.id !== ticketId,
        ),
        updatedAt: now,
      });
    }
  });
}

/** Nudges whoever has not played yet, once, a few hours before the end. */
async function remindDuel(duelId: string, now: number): Promise<void> {
  const duelRef = duels().doc(duelId) as DocumentReference;
  await firestore.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(duelRef);
    if (!snap.exists) return;
    const duel = snap.data() as DuelDoc;
    if (duel.remindAt === undefined || duel.remindAt > now) return;
    tx.update(duelRef, { remindAt: FieldValue.delete() });
    if (duel.status !== "active") return;
    const exerciseTitle = getDuelExercise(duel.exerciseId)?.title;
    for (const playerId of duel.playerIds) {
      if ((duel.players[playerId]?.attempts ?? 0) > 0) continue;
      notify(tx, {
        userId: playerId,
        type: "duel_reminder",
        duelId,
        ...(exerciseTitle ? { exerciseTitle } : {}),
      });
    }
  });
}

/**
 * Closes one duel: picks the winner, moves both ratings, files the duel under
 * both players' recent duels and tells them how it went. Idempotent — the
 * status is checked and flipped in the same transaction.
 */
export async function settleDuelById(
  duelId: string,
  now: number = Date.now(),
): Promise<void> {
  const duelRef = duels().doc(duelId) as DocumentReference;
  await firestore.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(duelRef);
    if (!snap.exists) return;
    const duel = snap.data() as DuelDoc;
    if (
      duel.status !== "active" ||
      duel.settleAt === undefined ||
      duel.settleAt > now
    )
      return;

    const [aId, bId] = duel.playerIds;
    const refs = {
      [aId]: profiles().doc(aId) as DocumentReference,
      [bId]: profiles().doc(bId) as DocumentReference,
    };
    const [aSnap, bSnap] = await Promise.all([
      tx.get(refs[aId]),
      tx.get(refs[bId]),
    ]);
    const stored: Record<string, DuelProfile | null> = {
      [aId]: readProfile(aSnap),
      [bId]: readProfile(bSnap),
    };

    const settlement = settleDuel(duel, {
      [aId]: {
        rating: stored[aId]?.rating ?? DUEL_START_RATING,
        played: stored[aId]?.played ?? 0,
      },
      [bId]: {
        rating: stored[bId]?.rating ?? DUEL_START_RATING,
        played: stored[bId]?.played ?? 0,
      },
    });
    const exerciseTitle = getDuelExercise(duel.exerciseId)?.title;

    tx.update(duelRef, {
      status: "finished",
      outcome: { ...settlement.outcome, settledAt: now },
      settleAt: FieldValue.delete(),
      remindAt: FieldValue.delete(),
      ...Object.fromEntries(
        duel.playerIds.flatMap((id) => [
          [`players.${id}.ratingBefore`, settlement.players[id].ratingBefore],
          [`players.${id}.ratingAfter`, settlement.players[id].ratingAfter],
        ]),
      ),
    });

    // The public row — names, scores, who won. Same transaction as the status
    // flip, so a duel is settled and announced together or not at all. `set`, not
    // `create`: the id is the duel's, and a rewrite is harmless where an
    // ALREADY_EXISTS would abort the settlement.
    const resultRow = buildDuelResultLog({
      ...duel,
      status: "finished",
      outcome: { ...settlement.outcome, settledAt: now },
      players: Object.fromEntries(
        duel.playerIds.map((id) => [
          id,
          {
            ...duel.players[id],
            ratingBefore: settlement.players[id].ratingBefore,
            ratingAfter: settlement.players[id].ratingAfter,
          },
        ]),
      ),
    });
    if (resultRow) {
      tx.set(
        firestore.collection("logs").doc(duelResultLogId(duelId)),
        resultRow,
      );
    }

    for (const id of duel.playerIds) {
      const opponentId = id === aId ? bId : aId;
      const side = settlement.players[id];
      const profile =
        stored[id] ??
        emptyProfile(
          {
            userId: id,
            displayName: duel.players[id].displayName,
            avatar: duel.players[id].avatar,
            lvl: duel.players[id].lvl,
          },
          now,
        );
      tx.set(
        refs[id],
        {
          ...(stored[id] ? {} : profile),
          ...settledProfileUpdate(profile, duelId, side, now),
        },
        { merge: true },
      );
      notify(tx, {
        userId: id,
        type: "duel_result",
        duelId,
        duelResult: side.result,
        ratingDelta: side.ratingAfter - side.ratingBefore,
        // Settled, so the opponent is no longer a secret.
        opponentName: duel.players[opponentId]?.displayName ?? "Anonymous",
        ...(exerciseTitle ? { exerciseTitle } : {}),
      });
    }
  });
}

/**
 * The cron's whole job: sweep expired tickets, send due reminders, settle
 * finished duels. Each item fails on its own — the next run tries it again.
 */
export async function runDuelCron(now: number = Date.now()) {
  const [expiredSnap, remindSnap, dueSnap] = await Promise.all([
    queue().where("expiresAt", "<=", now).limit(CRON_BATCH).get(),
    duels().where("remindAt", "<=", now).limit(CRON_BATCH).get(),
    duels().where("settleAt", "<=", now).limit(CRON_BATCH).get(),
  ]);
  const ids = (snap: { docs: QueryDocumentSnapshot[] }) =>
    snap.docs.map((doc) => doc.id);

  const run = async (
    label: string,
    list: string[],
    job: (id: string) => Promise<void>,
  ) => {
    let done = 0;
    for (const id of list) {
      try {
        await job(id);
        done++;
      } catch (error) {
        console.error(`[duels] ${label} ${id} failed`, error);
      }
    }
    return done;
  };

  return {
    expired: await run("expiring ticket", ids(expiredSnap), (id) =>
      expireTicket(id, now),
    ),
    reminded: await run("reminding", ids(remindSnap), (id) =>
      remindDuel(id, now),
    ),
    settled: await run("settling", ids(dueSnap), (id) =>
      settleDuelById(id, now),
    ),
  };
}

// ── Ready ────────────────────────────────────────────────────────────────────

/**
 * Ready: the player's best is final and no more runs land from them. The
 * second Ready moves `settleAt` to now and settles the duel on the spot — no
 * run can be in flight, since neither side takes runs any more. Should that
 * settlement fail, the cron finds the due `settleAt` on its next pass.
 */
export async function markDuelReady(
  userId: string,
  duelId: string,
  now: number = Date.now(),
): Promise<DuelReadyResult> {
  const duelRef = duels().doc(duelId) as DocumentReference;
  const isSettleDue = await firestore.runTransaction(
    async (tx: Transaction): Promise<boolean> => {
      const snap = await tx.get(duelRef);
      if (!snap.exists) throw new DuelError("NOT_FOUND");
      const duel = snap.data() as DuelDoc;
      const me = duel.players[userId];
      if (!me || !duel.playerIds.includes(userId))
        throw new DuelError("FORBIDDEN");
      if (me.readyAt) return duel.status === "active" && isEveryoneReady(duel);
      const refusal = readyRefusal(duel, userId, now);
      if (refusal) throw new DuelError(refusal);

      const isLast = isEveryoneReady({
        playerIds: duel.playerIds,
        players: { ...duel.players, [userId]: { ...me, readyAt: now } },
      });
      tx.update(duelRef, {
        [`players.${userId}.readyAt`]: now,
        ...(isLast ? { settleAt: now } : {}),
      });
      return isLast;
    },
  );
  if (!isSettleDue) return { isSettled: false };
  try {
    await settleDuelById(duelId, now);
    return { isSettled: true };
  } catch (error) {
    console.error(`[duels] settling ${duelId} on ready failed`, error);
    return { isSettled: false };
  }
}

// ── Overview ─────────────────────────────────────────────────────────────────

const toRankingEntry = (profile: DuelProfile): DuelRankingEntry => ({
  userId: profile.userId,
  displayName: profile.displayName,
  avatar: profile.avatar,
  lvl: profile.lvl,
  rating: profile.rating ?? DUEL_START_RATING,
  wins: profile.wins ?? 0,
  losses: profile.losses ?? 0,
  draws: profile.draws ?? 0,
});

/** Everything the duels page shows the player, opponents masked while duels run. */
export async function getDuelOverview(
  userId: string,
  now: number = Date.now(),
): Promise<DuelOverview> {
  const profile = readProfile(
    await (profiles().doc(userId) as DocumentReference).get(),
  );
  const activeIds = (profile?.active ?? []).map((entry) => entry.duelId);
  const recentIds = (profile?.recentDuelIds ?? []).filter(
    (id) => !activeIds.includes(id),
  );
  const duelRefs = [...activeIds, ...recentIds].map(
    (id) => duels().doc(id) as DocumentReference,
  );

  const [
    duelSnaps,
    rankingSnap,
    rankedCount,
    waitingCount,
    liveCount,
    aboveCount,
    feedSnap,
  ] = await Promise.all([
    duelRefs.length
      ? (firestore.getAll(...duelRefs) as Promise<DocumentSnapshot[]>)
      : Promise.resolve([]),
    profiles().orderBy("rating", "desc").limit(DUEL_RANKING_SIZE).get(),
    profiles().where("rating", ">=", 0).count().get(),
    queue().where("expiresAt", ">", now).count().get(),
    duels().where("status", "==", "active").count().get(),
    profile?.rating !== undefined
      ? profiles().where("rating", ">", profile.rating).count().get()
      : Promise.resolve(null),
    // Only settled duels carry `outcome`, so ordering by it leaves the running
    // ones out — no status filter, no composite index.
    duels().orderBy("outcome.settledAt", "desc").limit(DUEL_FEED_SIZE).get(),
  ]);

  const views = new Map<string, DuelView>();
  for (const snap of duelSnaps) {
    if (!snap.exists) continue;
    const view = toDuelView(snap.data() as DuelDoc, userId);
    if (view) views.set(view.id, view);
  }
  const pick = (ids: string[]) =>
    ids.map((id) => views.get(id)).filter((view): view is DuelView => !!view);
  const myLiveTickets = liveTickets(profile?.tickets ?? [], now);

  return {
    rating: profile?.rating ?? DUEL_START_RATING,
    isRated: profile?.rating !== undefined,
    rank: aboveCount ? aboveCount.data().count + 1 : null,
    played: profile?.played ?? 0,
    wins: profile?.wins ?? 0,
    losses: profile?.losses ?? 0,
    draws: profile?.draws ?? 0,
    tickets: myLiveTickets.sort((a, b) => a.createdAt - b.createdAt),
    active: pick(activeIds).sort((a, b) => a.endsAt - b.endsAt),
    recent: pick(recentIds).filter((view) => view.status === "finished"),
    ranking: rankingSnap.docs.map((doc: QueryDocumentSnapshot) =>
      toRankingEntry(doc.data() as DuelProfile),
    ),
    rankedPlayers: rankedCount.data().count,
    feed: feedForViewer(
      feedSnap.docs
        .map((doc: QueryDocumentSnapshot) =>
          toDuelFeedEntry(doc.data() as DuelDoc),
        )
        .filter((entry): entry is DuelFeedEntry => !!entry),
      userId,
    ),
    waitingOthers: Math.max(
      0,
      waitingCount.data().count - myLiveTickets.length,
    ),
    liveDuels: liveCount.data().count,
  };
}

/** The duel a practice session is about to play — only for one of its players. */
export async function getDuelForPlayer(
  userId: string,
  duelId: string,
): Promise<DuelView> {
  const snap: DocumentSnapshot = await (
    duels().doc(duelId) as DocumentReference
  ).get();
  if (!snap.exists) throw new DuelError("NOT_FOUND");
  const view = toDuelView(snap.data() as DuelDoc, userId);
  if (!view) throw new DuelError("FORBIDDEN");
  return view;
}
