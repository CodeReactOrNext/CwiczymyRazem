import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { authorizeGeneration } from "lib/roadmaps/generation/adminGuard";
import {
  isTicketExpired,
  markTicketProgress,
  openTicket,
  readTicket,
  refundTicket,
  storeTicketDraft,
  storeTicketStructure,
  ticketId,
} from "lib/roadmaps/generation/generationTicket";
import {
  isRoadmapLevel,
  MAX_GOAL_LENGTH,
  type RoadmapLevel,
} from "lib/roadmaps/generation/levels";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import {
  draftRoadmapStructure,
  generateRoadmapStructure,
  reviewRoadmapStructure,
  type StructurePhase,
} from "lib/roadmaps/generation/structure";
import type { TokenUsage } from "lib/roadmaps/generation/usage";
import {
  addUsage,
  emptyUsage,
  UsageLedger,
} from "lib/roadmaps/generation/usage";
import { findLibrarySong } from "lib/roadmaps/songLookup";
import { isRoadmapVisibility } from "lib/roadmaps/visibility";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The skeleton of a roadmap: phases, steps, the library exercise each step
 * practises, the library song a repertoire step is about, and what the
 * reviewer thought of the draft. Descriptions come from
 * /api/generate-phase-details, one phase at a time.
 *
 * A supporter's browser asks for it in two halves — `stage: "draft"`, then
 * `stage: "review"` — because the whole thing is two or three model calls and
 * several minutes, and one request that answers nothing until the end leaves a
 * progress bar frozen on its first percent. The admin queue asks for both at
 * once: it reports per roadmap, not per model call, and nobody watches it.
 *
 * A supporter pays for it in tokens, once per goal: the charge opens a ticket,
 * the draft and then the skeleton are stored on it, and any repeat of the same
 * goal within the hour — a retry, a reload — gets them back without paying
 * again. A failure before the draft exists refunds the ticket.
 */

/** Which half of the skeleton this call runs. Absent means both, in one go. */
type Stage = "draft" | "review";

const isStage = (value: unknown): value is Stage =>
  value === "draft" || value === "review";

const failWith = (res: NextApiResponse, error: unknown) => {
  if (error instanceof GenerationError) {
    console.error("[generate-roadmap]", error.message);
    return res.status(error.status).json({ message: error.message });
  }
  console.error("[generate-roadmap]", error);
  return res.status(500).json({ message: "Unexpected server error." });
};

/** A progress note must never be what sinks a generation. */
const noteProgress = (
  id: string,
  stage: Parameters<typeof markTicketProgress>[1],
) =>
  markTicketProgress(id, stage).catch((error) =>
    console.error("[generate-roadmap] progress note failed", id, error),
  );

/**
 * Stage one for a supporter: the tokens, then the draft.
 *
 * A failure here leaves nothing worth keeping, so the ticket goes back and the
 * next attempt starts clean.
 */
async function runDraftStage(
  res: NextApiResponse,
  uid: string,
  goal: string,
  level: RoadmapLevel,
  visibility: RoadmapVisibility,
) {
  const opened = await openTicket(uid, goal, level, visibility);
  if (!opened.ok) {
    return res.status(opened.status).json({ message: opened.error });
  }
  const { ticket, charged, wallet } = opened;

  const answer = (draft: StructurePhase[], usage: TokenUsage, paid: boolean) =>
    res.status(200).json({
      draft,
      ticketId: ticket.id,
      roadmapId: ticket.roadmapId,
      usage,
      charged: paid,
      tokensCharged: paid ? ticket.tokensCharged : 0,
      wallet,
    });

  // The draft this ticket already paid for, whether the review then failed or
  // the tab was simply reloaded.
  if (ticket.draft?.length) {
    return answer(ticket.draft, ticket.draftUsage ?? emptyUsage(), false);
  }

  try {
    const ledger = new UsageLedger();
    const draft = await draftRoadmapStructure(goal.trim(), level, ledger);
    const usage = ledger.totals();
    await storeTicketDraft(ticket.id, draft, usage);
    return answer(draft, usage, charged);
  } catch (error) {
    // No draft was stored, so the ticket has nothing to answer for: the tokens
    // go back whether this call charged them or an earlier, crashed one did.
    await refundTicket(ticket).catch((refundError) =>
      console.error("[generate-roadmap] refund failed", ticket.id, refundError),
    );
    return failWith(res, error);
  }
}

/**
 * Stage two for a supporter: the reviewer's pass over the draft already paid
 * for. The draft is read off the ticket rather than out of the request, so
 * what gets reviewed is what the model wrote.
 *
 * A failure here is deliberately not refunded: the draft survives on the
 * ticket, so retrying the same goal within the hour reviews it again for free,
 * which is worth more than the tokens back.
 */
async function runReviewStage(
  res: NextApiResponse,
  uid: string,
  goal: string,
  level: RoadmapLevel,
  visibility: RoadmapVisibility,
) {
  const ticket = await readTicket(ticketId(uid, goal, level, visibility));
  if (!ticket || isTicketExpired(ticket) || !ticket.draft?.length) {
    return res
      .status(409)
      .json({ message: "This generation has gone stale. Start it again." });
  }

  if (ticket.structure) {
    return res.status(200).json({
      ...ticket.structure,
      roadmapId: ticket.roadmapId,
      usage: ticket.reviewUsage ?? emptyUsage(),
    });
  }

  try {
    const ledger = new UsageLedger();
    await noteProgress(ticket.id, "review");
    const result = await reviewRoadmapStructure(
      goal.trim(),
      level,
      ticket.draft,
      {
        ledger,
        resolveSong: findLibrarySong,
        onRevise: () => noteProgress(ticket.id, "revise"),
      },
    );
    const usage = ledger.totals();
    await storeTicketStructure(
      ticket.id,
      result,
      addUsage(ticket.draftUsage ?? emptyUsage(), usage),
      usage,
    );
    return res
      .status(200)
      .json({ ...result, roadmapId: ticket.roadmapId, usage });
  } catch (error) {
    return failWith(res, error);
  }
}

/** Both stages in one request, for a supporter on a client that asks for that. */
async function runWholeSkeleton(
  res: NextApiResponse,
  uid: string,
  goal: string,
  level: RoadmapLevel,
  visibility: RoadmapVisibility,
) {
  const opened = await openTicket(uid, goal, level, visibility);
  if (!opened.ok) {
    return res.status(opened.status).json({ message: opened.error });
  }
  const { ticket, charged, wallet } = opened;

  if (ticket.structure) {
    return res.status(200).json({
      ...ticket.structure,
      usage: ticket.usage ?? emptyUsage(),
      roadmapId: ticket.roadmapId,
      charged: false,
      tokensCharged: 0,
      wallet,
    });
  }

  try {
    const ledger = new UsageLedger();
    const result = await generateRoadmapStructure(
      goal.trim(),
      level,
      ledger,
      findLibrarySong,
    );
    const usage = ledger.totals();
    await storeTicketStructure(ticket.id, result, usage);
    return res.status(200).json({
      ...result,
      usage,
      roadmapId: ticket.roadmapId,
      charged,
      tokensCharged: charged ? ticket.tokensCharged : 0,
      wallet,
    });
  } catch (error) {
    await refundTicket(ticket).catch((refundError) =>
      console.error("[generate-roadmap] refund failed", ticket.id, refundError),
    );
    return failWith(res, error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const auth = await authorizeGeneration(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message });
  }

  const { goal, level, stage, visibility } = req.body as {
    goal?: string;
    level?: string;
    stage?: unknown;
    visibility?: unknown;
  };

  if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
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
  if (stage !== undefined && !isStage(stage)) {
    return res.status(400).json({ message: "Invalid stage." });
  }
  // Absent on a client from before the choice existed: those were all public.
  const chosenVisibility: RoadmapVisibility = isRoadmapVisibility(visibility)
    ? visibility
    : "public";
  if (visibility !== undefined && !isRoadmapVisibility(visibility)) {
    return res.status(400).json({ message: "Invalid visibility." });
  }

  // ── Admin queue: no wallet, no ticket, and no split to report against ──
  if (!auth.uid) {
    try {
      const ledger = new UsageLedger();
      const result = await generateRoadmapStructure(
        goal.trim(),
        level,
        ledger,
        findLibrarySong,
      );
      return res.status(200).json({ ...result, usage: ledger.totals() });
    } catch (error) {
      return failWith(res, error);
    }
  }

  // ── Supporter: tokens first, then whichever half was asked for ──
  if (stage === "draft") {
    return runDraftStage(res, auth.uid, goal, level, chosenVisibility);
  }
  if (stage === "review") {
    return runReviewStage(res, auth.uid, goal, level, chosenVisibility);
  }
  return runWholeSkeleton(res, auth.uid, goal, level, chosenVisibility);
}
