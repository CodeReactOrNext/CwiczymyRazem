import { getDailyDayKey } from "feature/dailyExercise/utils/dailyExercise";
import type { FeatureGoalId } from "feature/whatNext/data/featureGoals";
import { FEATURE_GOAL_IDS } from "feature/whatNext/data/featureGoals";
import type { FeatureGoalCases } from "feature/whatNext/utils/featureGoalCases";
import {
  featureGoalBaseline,
  featureGoalCases,
  featureGoalCasesPayable,
} from "feature/whatNext/utils/featureGoalCases";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { detectFeatureGoals } from "lib/featureGoals/detectFeatureGoals";
import { readRewardLedger } from "lib/rewards/rewardLedger";

/**
 * Which of `goals` are done, remembering every new find.
 *
 * A goal once done stays done, so what was found before is taken from
 * `rewards.doneFeatureGoals` and only the rest is looked up. Whatever the
 * lookup newly finds is written back, so the next visit skips it too. The
 * write is best effort: if it fails, the goal is simply looked up again.
 */
export const resolveFeatureGoals = async (
  db: Firestore,
  userId: string,
  userData: Record<string, any>,
  goals: FeatureGoalId[],
): Promise<Set<FeatureGoalId>> => {
  const known = new Set(readRewardLedger(userData).doneFeatureGoals);
  const done = new Set(goals.filter((goal) => known.has(goal)));
  const unknown = goals.filter((goal) => !known.has(goal));
  if (unknown.length === 0) return done;

  const found = [...(await detectFeatureGoals(db, userId, userData, unknown))];
  if (found.length > 0) {
    try {
      await db
        .collection("users")
        .doc(userId)
        .update({
          "rewards.doneFeatureGoals": FieldValue.arrayUnion(...found),
        });
    } catch (error) {
      console.error("[feature-goals] could not remember done goals", error);
    }
  }
  found.forEach((goal) => done.add(goal));
  return done;
};

/**
 * The account's goal baseline, sealed now if this is the first look: the goals
 * done at this moment, or none for a new account. Sealed in a transaction so
 * two first looks at once cannot write two different baselines.
 */
export const ensureFeatureGoalBaseline = async (
  db: Firestore,
  userId: string,
  done: ReadonlySet<string>,
): Promise<string[]> => {
  const userRef = db.collection("users").doc(userId);
  return db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const data = snap.data() ?? {};
    const sealed = readRewardLedger(data).featureGoalBaseline;
    if (sealed) return sealed;
    const baseline = featureGoalBaseline(
      done,
      Number(data.statistics?.sessionCount) || 0,
    );
    t.update(userRef, { "rewards.featureGoalBaseline": baseline });
    return baseline;
  });
};

/** Every goal's state and what it is worth in free cases. */
export const readFeatureGoalCases = async (
  db: Firestore,
  userId: string,
  userData: Record<string, any>,
): Promise<{ done: Set<FeatureGoalId>; cases: FeatureGoalCases }> => {
  const done = await resolveFeatureGoals(db, userId, userData, [
    ...FEATURE_GOAL_IDS,
  ]);
  const ledger = readRewardLedger(userData);
  const baseline =
    ledger.featureGoalBaseline ??
    (await ensureFeatureGoalBaseline(db, userId, done));
  return {
    done,
    cases: featureGoalCases(done, baseline, ledger.featureGoalCasesPaid),
  };
};

/**
 * Puts the free cases the goals have earned and not yet paid into the stash —
 * at most FEATURE_GOAL_CASES_PER_DAY a day; the rest wait for the next days.
 * Nothing to collect by hand: the paid count is read again inside the
 * transaction, so two looks at once still pay each case once. Returns how
 * many were paid just now.
 */
export const payFeatureGoalCases = async (
  db: Firestore,
  userId: string,
  done: ReadonlySet<string>,
): Promise<number> => {
  const userRef = db.collection("users").doc(userId);
  return db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const ledger = readRewardLedger(snap.data());
    if (!ledger.featureGoalBaseline) return 0;
    const cases = featureGoalCases(
      done,
      ledger.featureGoalBaseline,
      ledger.featureGoalCasesPaid,
    );
    const today = getDailyDayKey();
    const payable = featureGoalCasesPayable(
      cases.owed,
      ledger.featureGoalCaseDay,
      today,
    );
    if (payable === 0) return 0;
    t.update(userRef, {
      "rewards.caseTokens": FieldValue.increment(payable),
      "rewards.featureGoalCasesPaid": cases.paid + payable,
      "rewards.featureGoalCaseDay": today,
    });
    return payable;
  });
};
