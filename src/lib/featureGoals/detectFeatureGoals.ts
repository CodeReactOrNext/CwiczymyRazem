import { getDailyDayKey } from "feature/dailyExercise/utils/dailyExercise";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { FeatureGoalId } from "feature/whatNext/data/featureGoals";
import type { Firestore, Query } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import type { UserDocGoal } from "lib/featureGoals/featureGoalChecks";
import {
  checkUserDocGoal,
  hasBossRun,
  hasCalendarItems,
  hasClearedScale,
  hasClearedTempo,
  hasJourneyStep,
  hasSecondDayInStats,
  hasWeeklyClaim,
  spansTwoDays,
  USER_DOC_GOALS,
} from "lib/featureGoals/featureGoalChecks";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far back a played exercise of the day still counts. */
const DAILY_LOOKBACK_DAYS = 7;

const DEFAULT_PLAN_IDS = defaultPlans.map((plan) => plan.id);

const chunks = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

const isUserDocGoal = (goal: FeatureGoalId): goal is UserDocGoal =>
  (USER_DOC_GOALS as readonly string[]).includes(goal);

/**
 * Which of `goals` this player has done, read with the Admin SDK.
 *
 * Every check is the cheapest read that can answer it — the user document the
 * caller already holds, one settings document, or a query cut to one result —
 * and only the goals still uncollected are asked about, so an account that has
 * collected everything costs nothing here. A check that fails to read counts
 * as not done: the goal simply waits for the next look.
 */
export const detectFeatureGoals = async (
  db: Firestore,
  userId: string,
  userData: Record<string, any>,
  goals: FeatureGoalId[],
): Promise<Set<FeatureGoalId>> => {
  const userRef = db.collection("users").doc(userId);
  const settings = (name: string) =>
    userRef
      .collection("settings")
      .doc(name)
      .get()
      .then((snap) => snap.data());
  const any = (query: Query) =>
    query
      .limit(1)
      .select()
      .get()
      .then((snap) => !snap.empty);
  const logs = userRef.collection("exerciseData");

  // The skill and scale trees both read the tempo records; read them once.
  let tempos: Promise<Map<string, number[]>> | null = null;
  const readTempos = () =>
    (tempos ??= userRef
      .collection("exerciseBpmProgress")
      .select("completedBpms")
      .get()
      .then(
        (snap) =>
          new Map(
            snap.docs.map((doc) => [
              doc.id,
              (doc.get("completedBpms") as number[] | undefined) ?? [],
            ]),
          ),
      ));

  const check = async (goal: FeatureGoalId): Promise<boolean> => {
    if (isUserDocGoal(goal)) return checkUserDocGoal(goal, userData);

    switch (goal) {
      case "first_song":
        return any(userRef.collection("userSongs"));
      case "tempo_goal":
        return any(userRef.collection("exerciseGoals"));
      case "second_day": {
        if (hasSecondDayInStats(userData)) return true;
        const [first, last] = await Promise.all([
          logs.orderBy(FieldPath.documentId()).limit(1).select().get(),
          logs.orderBy(FieldPath.documentId(), "desc").limit(1).select().get(),
        ]);
        return spansTwoDays(
          first.docs[0]?.id,
          last.docs[0]?.id,
          userData.statistics?.timeZone,
        );
      }
      case "practice_plan": {
        const found = await Promise.all(
          chunks(DEFAULT_PLAN_IDS, 30).map((ids) =>
            any(logs.where("planId", "in", ids)),
          ),
        );
        return found.some(Boolean);
      }
      case "auto_plan":
        // Auto plans are filed as "auto-<timestamp>"; "." sorts right after "-".
        return any(
          logs.where("planId", ">=", "auto-").where("planId", "<", "auto."),
        );
      case "journey_step": {
        const snap = await db.collection("journeyProgress").doc(userId).get();
        return hasJourneyStep(snap.data());
      }
      case "play_song":
        return any(
          userRef.collection("songProgress").where("lastPracticedAt", "!=", null),
        );
      case "daily_exercise": {
        const now = Date.now();
        const refs = Array.from({ length: DAILY_LOOKBACK_DAYS }, (_, days) =>
          db
            .collection("dailyExerciseLeaderboards")
            .doc(getDailyDayKey(new Date(now - days * DAY_MS)))
            .collection("entries")
            .doc(userId),
        );
        const snaps = await db.getAll(...refs);
        return snaps.some((snap) => snap.exists);
      }
      case "weekly_goal":
        return hasWeeklyClaim(await settings("practiceLevels"));
      case "skill_tree":
        return hasClearedTempo(await readTempos());
      case "scale_tree":
        return hasClearedScale(await readTempos());
      case "calendar":
        return hasCalendarItems(await settings("calendar"));
      case "rotation": {
        const doc = await settings("rotation");
        return Array.isArray(doc?.items) && doc.items.length > 0;
      }
      case "own_plan":
        return any(db.collection("exercisePlans").where("userId", "==", userId));
      case "customize":
        // Both layouts are written only from their Customize panels.
        return (
          !!userData.profileLayout || (await settings("dashboard")) !== undefined
        );
      case "own_exercise":
        return any(
          db.collection("communityExercises").where("authorId", "==", userId),
        );
      case "boss":
        return hasBossRun(await settings("bossFights"));
      case "duel":
        return any(
          db.collection("duels").where("playerIds", "array-contains", userId),
        );
      case "challenge": {
        const [submitted, nominated] = await Promise.all([
          any(db.collection("challengeSubmissions").where("userId", "==", userId)),
          any(
            db.collection("challengeNominations").where("nominatedBy", "==", userId),
          ),
        ]);
        return submitted || nominated;
      }
    }
    return false;
  };

  const results = await Promise.all(
    goals.map(async (goal) => {
      try {
        return (await check(goal)) ? goal : null;
      } catch (error) {
        console.error(`[feature-goals] check failed: ${goal}`, error);
        return null;
      }
    }),
  );
  return new Set(results.filter((goal): goal is FeatureGoalId => !!goal));
};
