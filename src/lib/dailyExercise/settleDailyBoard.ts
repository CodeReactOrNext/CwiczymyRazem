import type { SalvagedMod, ScrapPart } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import type {
  DailyBoardPlace,
  DailyExerciseEntry,
  DailyExercisePrize,
} from "feature/dailyExercise/types/dailyExercise.types";
import {
  DAILY_LEADERBOARD_SIZE,
  getSettleableDayKeys,
  rankDailyBoard,
} from "feature/dailyExercise/utils/dailyExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { DocumentData, DocumentReference, QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

import { describeDailyPrize, getDailyPrize } from "./dailyPrize";

const PRIZE_SOURCE = "Exercise of the day";

/**
 * Results written in the settling transaction itself, which caps at 500 writes.
 * A board with more players than this gets the rest in batches right after.
 */
const NOTIFY_IN_TRANSACTION = 400;
const NOTIFY_BATCH_SIZE = 450;

/** The user-document write that puts `prize` into the winner's Arsenal. */
const prizeWrite = (prize: DailyExercisePrize, dayKey: string, data: DocumentData): Record<string, unknown> => {
  if (prize.kind === "mod") {
    const mod: SalvagedMod = {
      // Keyed by the day: one prize mod per board, so it can never collide in the stash.
      id: `daily:${dayKey}:${prize.featureId}`,
      featureId: prize.featureId,
      kind: prize.modKind,
      points: prize.points,
      sourceName: PRIZE_SOURCE,
      salvagedAt: Date.now(),
    };
    return { "arsenal.salvagedMods": [...(data.arsenal?.salvagedMods ?? []), mod] };
  }
  const part: ScrapPart = { partId: prize.partId, tier: prize.tier, qty: 1 };
  return { "arsenal.parts": addPartsToWallet(data.arsenal?.parts ?? [], [part]) };
};

/**
 * Closes one day's board: its #1 gets the day's prize — the one the card showed
 * all day — and a notification saying so; everyone else who played hears where
 * they finished. Every result carries the board's top five, so a player below
 * it still sees the board and their own place under it.
 *
 * Idempotent: the board's `settled` flag is checked and set in the same
 * transaction that pays and notifies, so two requests racing to settle pay and
 * notify once. Only ever called for a closed day (canSettleDailyBoard), so the
 * entries read up front can't move before the transaction lands.
 */
export async function settleDailyBoard(dayKey: string): Promise<void> {
  const boardRef = firestore.collection("dailyExerciseLeaderboards").doc(dayKey) as DocumentReference;
  const notifications = firestore.collection("notifications");

  const boardSnap = await boardRef.get();
  // No board doc: nobody played that day, there is nothing to settle.
  if (!boardSnap.exists || boardSnap.data()?.settled) return;

  const entriesSnap = await boardRef.collection("entries").orderBy("score", "desc").get();
  const all = entriesSnap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as DailyExerciseEntry);
  const ranked = rankDailyBoard(all, all.length);
  const [winner = null] = ranked;

  const exerciseId: string | undefined = boardSnap.data()?.exerciseId;
  const exerciseTitle = exercisesAgregat.find((exercise) => exercise.id === exerciseId)?.title;
  const board: DailyBoardPlace[] = ranked
    .slice(0, DAILY_LEADERBOARD_SIZE)
    .map((entry, i) => ({ place: i + 1, displayName: entry.displayName, score: entry.score }));

  /** What every result says: the recipient's place and score, and the board around it. */
  const result = (entry: DailyExerciseEntry, place: number) => ({
    userId: entry.userId,
    dayKey,
    place,
    score: entry.score,
    players: ranked.length,
    board,
    ...(exerciseTitle ? { exerciseTitle } : {}),
    isRead: false,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Places 2 and down — they won nothing, but they finished on the board.
  const placed = ranked.slice(1).map((entry, i) => ({ ...result(entry, i + 2), type: "daily_exercise_place" }));

  const settledNow = await firestore.runTransaction(async (t: Transaction) => {
    if ((await t.get(boardRef)).data()?.settled) return false;

    const userRef = winner ? (firestore.collection("users").doc(winner.userId) as DocumentReference) : null;
    const userDoc = userRef ? await t.get(userRef) : null;

    placed.slice(0, NOTIFY_IN_TRANSACTION).forEach((notification) => t.set(notifications.doc(), notification));

    if (!winner || !userRef || !userDoc?.exists) {
      t.set(boardRef, { settled: true, settledAt: Date.now(), winner: null }, { merge: true });
      return true;
    }

    const prize = getDailyPrize(dayKey);
    t.update(userRef, prizeWrite(prize, dayKey, userDoc.data()!));
    t.set(boardRef, {
      settled: true,
      settledAt: Date.now(),
      winner: { userId: winner.userId, displayName: winner.displayName, score: winner.score, prize },
    }, { merge: true });
    t.set(notifications.doc(), {
      ...result(winner, 1),
      type: "daily_exercise_win",
      prizeName: describeDailyPrize(prize),
    });
    return true;
  });

  // Only whoever settled the board sends the rest, so they go out once too.
  if (!settledNow) return;
  const overflow = placed.slice(NOTIFY_IN_TRANSACTION);
  for (let i = 0; i < overflow.length; i += NOTIFY_BATCH_SIZE) {
    const batch = firestore.batch();
    overflow.slice(i, i + NOTIFY_BATCH_SIZE).forEach((notification) => batch.set(notifications.doc(), notification));
    await batch.commit();
  }
}

/**
 * Settles every recently closed board that still owes its winner — the daily
 * cron's job (api/cron/daily-exercise). One day failing doesn't stop the rest,
 * and the next run tries it again. Returns the days it went through.
 */
export async function settleRecentDailyBoards(now: Date = new Date()): Promise<string[]> {
  const days = getSettleableDayKeys(now);
  for (const dayKey of days) {
    try {
      await settleDailyBoard(dayKey);
    } catch (error) {
      console.error(`[daily-exercise] settling ${dayKey} failed`, error);
    }
  }
  return days;
}
