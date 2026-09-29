import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import {
  sanitizeGoalContext,
  sanitizeTitle,
} from "lib/roadmaps/generation/goalContext";
import {
  isRoadmapLevel,
  MAX_GOAL_LENGTH,
} from "lib/roadmaps/generation/levels";
import { runPreflight } from "lib/roadmaps/generation/preflight";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Free calls need a ceiling: a model call per goal edit, twenty times a day,
 * is a few cents; without the ceiling it is a script's playground.
 */
const PREFLIGHTS_PER_DAY = 20;
const QUOTA_COLLECTION = "roadmapPreflightQuota";

const dayKey = (now: Date) => now.toISOString().slice(0, 10);

/** Takes one of today's preflights for the player, or answers false when they are spent. */
async function reservePreflight(uid: string): Promise<boolean> {
  const ref = firestore
    .collection(QUOTA_COLLECTION)
    .doc(uid) as DocumentReference;
  return firestore.runTransaction(async (tx: Transaction) => {
    const snap = (await tx.get(ref)) as DocumentSnapshot;
    const data = snap.data() as { day?: string; used?: number } | undefined;
    const today = dayKey(new Date());
    const used = data?.day === today ? (data.used ?? 0) : 0;
    if (used >= PREFLIGHTS_PER_DAY) return false;
    tx.set(ref, { day: today, used: used + 1 });
    return true;
  });
}

/**
 * Looks at a goal before the player pays for it: whether it is about guitar,
 * whether the model knows it well enough, which questions to ask, and which
 * of the songs it names the library has. Nothing is charged and nothing is
 * generated; the answer only shapes the brief that `start` then receives.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const auth = await requireSupporter(req);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.error });

  const { title, goal, level, context } = req.body as {
    title?: unknown;
    goal?: unknown;
    level?: unknown;
    context?: unknown;
  };
  if (typeof goal !== "string" || goal.trim().length < 5) {
    return res.status(400).json({
      message: "Please enter a guitar-related goal (minimum 5 characters).",
    });
  }
  if (goal.length > MAX_GOAL_LENGTH) {
    return res
      .status(400)
      .json({ message: `Goal must be at most ${MAX_GOAL_LENGTH} characters.` });
  }
  if (!isRoadmapLevel(level)) {
    return res.status(400).json({ message: "Invalid skill level." });
  }

  try {
    if (!(await reservePreflight(auth.session.uid))) {
      return res.status(429).json({
        message:
          "That is enough goal checks for today — come back tomorrow, or generate with what you have.",
      });
    }
    const result = await runPreflight({
      goal: goal.trim(),
      title: sanitizeTitle(title),
      level,
      context: sanitizeGoalContext(context),
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[roadmap-jobs/preflight]", error);
    return res.status(502).json({ message: "Could not check the goal." });
  }
}
