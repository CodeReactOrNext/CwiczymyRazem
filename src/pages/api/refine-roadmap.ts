import type { RefineAction } from "feature/aiCoach/types/refine.types";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { describePhaseSteps } from "lib/roadmaps/generation/descriptions";
import { matchExercisesForStep } from "lib/roadmaps/generation/exerciseMatch";
import { extendPhase } from "lib/roadmaps/generation/extendPhase";
import {
  isRoadmapLevel,
  MAX_GOAL_LENGTH,
  type RoadmapLevel,
} from "lib/roadmaps/generation/levels";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import { extractSongFromStep } from "lib/roadmaps/generation/songMatch";
import { UsageLedger } from "lib/roadmaps/generation/usage";
import { searchLessonsForStep } from "lib/roadmaps/lessonSearch";
import { clampAddCount, isRefineAction, refineCost } from "lib/roadmaps/refine";
import { findLibrarySong } from "lib/roadmaps/songLookup";
import { requireSupporter } from "lib/support/supporterAuth";
import { refundTokens, spendTokens } from "lib/support/tokenWallet";
import type { NextApiRequest, NextApiResponse } from "next";

const MAX_GUIDANCE_LENGTH = 500;
const MAX_TEXT_LENGTH = 4000;

interface RefineBody {
  action?: unknown;
  goal?: unknown;
  level?: unknown;
  guidance?: unknown;
  phases?: unknown;
  phaseIndex?: unknown;
  stepId?: unknown;
  afterStepId?: unknown;
  count?: unknown;
  stepTitle?: unknown;
  description?: unknown;
}

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max) : "";

const phasesOf = (
  body: RefineBody,
): { phases: RoadmapPhase[]; phaseIndex: number } | null => {
  const { phases, phaseIndex } = body;
  if (
    !Array.isArray(phases) ||
    typeof phaseIndex !== "number" ||
    !phases[phaseIndex]?.steps?.length
  ) {
    return null;
  }
  return { phases: phases as RoadmapPhase[], phaseIndex };
};

interface ActionContext {
  goal: string;
  level: RoadmapLevel;
  guidance: string;
  count: number;
  ledger: UsageLedger;
}

async function runAction(
  action: RefineAction,
  body: RefineBody,
  { goal, level, guidance, count, ledger }: ActionContext,
): Promise<Record<string, unknown>> {
  switch (action) {
    case "rewriteStep": {
      const target = phasesOf(body);
      const stepId = typeof body.stepId === "string" ? body.stepId : "";
      if (
        !target ||
        !target.phases[target.phaseIndex].steps.some(
          (step) => step.id === stepId,
        )
      ) {
        throw new GenerationError("That step is not in this roadmap.", 400);
      }
      const phase = await describePhaseSteps({
        goal,
        level,
        phases: target.phases,
        phaseIndex: target.phaseIndex,
        stepIds: [stepId],
        guidance,
        ledger,
      });
      return { phase };
    }

    case "swapExercise": {
      const stepTitle = text(body.stepTitle, 200);
      if (!stepTitle) throw new GenerationError("Invalid stepTitle.", 400);
      const description = text(body.description, MAX_TEXT_LENGTH);
      const exerciseIds = await matchExercisesForStep({
        stepTitle,
        description: guidance
          ? `${description}\n\nThe student asks: ${guidance}`
          : description,
        goal,
        level,
      });
      return { exerciseIds };
    }

    case "refreshLessons": {
      const stepTitle = text(body.stepTitle, 200);
      if (!stepTitle) throw new GenerationError("Invalid stepTitle.", 400);
      const { lessons, usage } = await searchLessonsForStep({
        stepTitle,
        stepDescription: text(body.description, MAX_TEXT_LENGTH),
        roadmapGoal: goal,
        roadmapLevel: level,
      });
      ledger.add(usage);
      return { lessons };
    }

    case "findSong": {
      const stepTitle = text(body.stepTitle, 200);
      if (!stepTitle) throw new GenerationError("Invalid stepTitle.", 400);
      const requested = await extractSongFromStep({
        stepTitle,
        description: text(body.description, MAX_TEXT_LENGTH),
        goal,
      });
      const song = requested ? await findLibrarySong(requested) : null;
      return { requested, song };
    }

    case "addSteps": {
      const target = phasesOf(body);
      if (!target)
        throw new GenerationError("Invalid phases or phaseIndex.", 400);
      const result = await extendPhase({
        goal,
        level,
        phases: target.phases,
        phaseIndex: target.phaseIndex,
        afterStepId:
          typeof body.afterStepId === "string" ? body.afterStepId : null,
        count,
        guidance,
        ledger,
        resolveSong: findLibrarySong,
      });
      return { ...result };
    }

    default:
      throw new GenerationError("Unknown refinement.", 400);
  }
}

/**
 * One paid change to a roadmap the signed-in supporter generated: a step
 * rewritten to their note, its exercise or lessons or song searched again, or
 * a step or two added to a phase. The wallet is charged before the model is
 * asked and refunded if the model fails; what comes back is content only —
 * the browser writes it into the roadmap it owns, as it does every tick.
 *
 * Removing a step costs the app nothing and never comes here.
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
  const { uid } = auth.session;

  const body = req.body as RefineBody;
  const { action, goal, level } = body;
  if (!isRefineAction(action)) {
    return res.status(400).json({ message: "Unknown refinement." });
  }
  if (
    typeof goal !== "string" ||
    !goal.trim() ||
    goal.length > MAX_GOAL_LENGTH
  ) {
    return res.status(400).json({ message: "Invalid goal." });
  }
  if (!isRoadmapLevel(level)) {
    return res.status(400).json({ message: "Invalid skill level." });
  }
  const guidance = text(body.guidance, MAX_GUIDANCE_LENGTH).trim();
  const count = clampAddCount(body.count);
  const cost = refineCost(action, count);

  const spend = await spendTokens(uid, cost);
  if (!spend.ok) return res.status(spend.status).json({ message: spend.error });

  try {
    const ledger = new UsageLedger();
    const result = await runAction(action, body, {
      goal: goal.trim(),
      level,
      guidance,
      count,
      ledger,
    });
    return res.status(200).json({
      ...result,
      wallet: spend.wallet,
      tokensCharged: cost,
      usage: ledger.totals(),
    });
  } catch (error) {
    // The model did not deliver, so the tokens go back before the error does.
    await refundTokens(uid, cost).catch((refundError) =>
      console.error("[refine-roadmap] refund failed", uid, refundError),
    );
    if (error instanceof GenerationError) {
      console.error("[refine-roadmap]", action, error.message);
      return res.status(error.status).json({ message: error.message });
    }
    console.error("[refine-roadmap]", action, error);
    return res.status(500).json({ message: "Unexpected server error." });
  }
}
