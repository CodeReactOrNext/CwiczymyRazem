import type { SalvagedMod, ScrapPart } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import type { DailyExerciseEntry, DailyExercisePrize } from "feature/dailyExercise/types/dailyExercise.types";
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
 * all day — and a notification saying so; the rest of the top five hear where
 * they finished. Idempotent: the board's `settled` flag is checked and set in
 * the same transaction that pays and notifies, so two requests racing to
 * settle pay and notify once.
 *
 * Only ever called for a closed day (canSettleDailyBoard), so the top and the
 * player count read up front can't move before the transaction lands.
 */
export async function settleDailyBoard(dayKey: string): Promise<void> {
  const boardRef = firestore.collection("dailyExerciseLeaderboards").doc(dayKey) as DocumentReference;
  const entries = boardRef.collection("entries");

  const boardSnap = await boardRef.get();
  // No board doc: nobody played that day, there is nothing to settle.
  if (!boardSnap.exists || boardSnap.data()?.settled) return;

  const [topSnap, countSnap] = await Promise.all([
    entries.orderBy("score", "desc").limit(DAILY_LEADERBOARD_SIZE).get(),
    entries.count().get(),
  ]);
  const [winner = null, ...placed] = rankDailyBoard(
    topSnap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as DailyExerciseEntry),
    countSnap.data().count,
  );
  const exerciseId: string | undefined = boardSnap.data()?.exerciseId;
  const exerciseTitle = exercisesAgregat.find((exercise) => exercise.id === exerciseId)?.title;

  await firestore.runTransaction(async (t: Transaction) => {
    const board = await t.get(boardRef);
    if (board.data()?.settled) return;

    const userRef = winner ? (firestore.collection("users").doc(winner.userId) as DocumentReference) : null;
    const userDoc = userRef ? await t.get(userRef) : null;

    // Places 2–5 — they won nothing, but they finished on the board.
    placed.forEach((entry, i) => {
      t.set(firestore.collection("notifications").doc(), {
        userId: entry.userId,
        type: "daily_exercise_place",
        dayKey,
        place: i + 2,
        ...(exerciseTitle ? { exerciseTitle } : {}),
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
      });
    });

    if (!winner || !userRef || !userDoc?.exists) {
      t.set(boardRef, { settled: true, settledAt: Date.now(), winner: null }, { merge: true });
      return;
    }

    const prize = getDailyPrize(dayKey);
    t.update(userRef, prizeWrite(prize, dayKey, userDoc.data()!));
    t.set(boardRef, {
      settled: true,
      settledAt: Date.now(),
      winner: { userId: winner.userId, displayName: winner.displayName, score: winner.score, prize },
    }, { merge: true });
    t.set(firestore.collection("notifications").doc(), {
      userId: winner.userId,
      type: "daily_exercise_win",
      dayKey,
      prizeName: describeDailyPrize(prize),
      isRead: false,
      timestamp: FieldValue.serverTimestamp(),
    });
  });
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
