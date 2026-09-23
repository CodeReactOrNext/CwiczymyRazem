import { createHash } from "crypto";
import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import {
  spendFromWallet,
  walletFromStored,
} from "feature/supporterPanel/utils/supporterTokens";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { chargeTokens, describeWallet, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";
import { v4 as uuidv4 } from "uuid";

import { roadmapGenerationCost } from "../visibility";
import type { StoredRoadmapJob } from "./jobPlan";
import type { GeneratedStructure, StructurePhase } from "./structure";
import type { TokenUsage } from "./usage";

/**
 * A paid generation, from the moment the tokens leave the wallet to the
 * moment the skeleton is stored. The pipeline runs as several requests from
 * the browser, so the charge cannot live inside one of them: it lives here.
 *
 * One ticket per (player, goal, level). While it is fresh, every request for
 * the same goal reuses it — a retry after a failed phase, or a tab that was
 * reloaded, gets the stored skeleton back for free instead of paying twice.
 * The roadmap id is minted with the ticket for the same reason: a second
 * save of the same generation overwrites the first rather than duplicating it.
 */
const COLLECTION = "roadmapGenerations";
const WALLET_FIELD = "supporterTokens";

/** How long a ticket stays reusable. Long enough for any retry, short enough to bill a real second roadmap. */
export const TICKET_TTL_MS = 60 * 60 * 1000;

/**
 * Which half of the skeleton the server is on. The browser knows which stage
 * it asked for; what it cannot know is that the reviewer rejected the draft
 * and a full rewrite has begun, which is the slowest stage of the lot.
 */
export type GenerationTicketStage = "draft" | "review" | "revise" | "done";

export interface GenerationTicketProgress {
  stage: GenerationTicketStage;
  updatedAt: string;
}

export interface GenerationTicket {
  id: string;
  uid: string;
  goal: string;
  level: string;
  /** The id the finished roadmap is saved under. */
  roadmapId: string;
  tokensCharged: number;
  /** What was paid for: a roadmap for the board, or one for its owner alone. */
  visibility: RoadmapVisibility;
  createdAt: string;
  /**
   * The skeleton stage one drafted, kept so a retry reviews that draft rather
   * than paying a second model call to write the same plan again.
   */
  draft: StructurePhase[] | null;
  draftUsage: TokenUsage | null;
  reviewUsage: TokenUsage | null;
  /** Filled in once the skeleton has been generated; null while it is running or after it failed. */
  structure: GeneratedStructure | null;
  usage: TokenUsage | null;
  /** What the server is doing right now — read by /api/roadmap-generation-status. */
  progress: GenerationTicketProgress | null;
  /** The name the player gave the roadmap; the goal is its description. */
  title?: string | null;
  /** What the player added about themselves, for the prompts; never part of the ticket id. */
  context?: RoadmapGoalContext | null;
  /** The server-side run of the rest of the pipeline, when it runs in the background. */
  job?: StoredRoadmapJob | null;
}

export type OpenTicketResult =
  | {
      ok: true;
      ticket: GenerationTicket;
      charged: boolean;
      wallet: SupporterWallet;
    }
  | { ok: false; status: 402; error: string };

/** Same goal, same level, same player → same ticket, whatever the casing or the spaces. */
export const ticketId = (
  uid: string,
  goal: string,
  level: string,
  visibility: RoadmapVisibility = "public",
): string => {
  // A private and a public roadmap for the same goal are two purchases at two
  // prices, so they are two tickets.
  const hash = createHash("sha1")
    .update(`${goal.trim().toLowerCase()}|${level}|${visibility}`)
    .digest("base64url")
    .slice(0, 16);
  return `${uid}_${hash}`;
};

const ticketRef = (id: string): DocumentReference =>
  firestore.collection(COLLECTION).doc(id);

export const isTicketExpired = (
  ticket: GenerationTicket,
  now = Date.now(),
): boolean => now - new Date(ticket.createdAt).getTime() > TICKET_TTL_MS;

/**
 * Finds the player's fresh ticket for this goal, or charges the wallet and
 * opens one. The charge and the ticket are one transaction: a double click
 * cannot pay twice, and a wallet that cannot cover it writes nothing.
 */
export async function openTicket(
  uid: string,
  goal: string,
  level: string,
  visibility: RoadmapVisibility = "public",
  context: RoadmapGoalContext | null = null,
  title: string | null = null,
): Promise<OpenTicketResult> {
  const id = ticketId(uid, goal, level, visibility);
  const ref = ticketRef(id);
  const cost = roadmapGenerationCost(visibility);

  const result = await firestore.runTransaction(async (tx: Transaction) => {
    const [ticketSnap, user] = (await Promise.all([
      tx.get(ref),
      tx.get(userRef(uid)),
    ])) as [DocumentSnapshot, DocumentSnapshot];
    const existing = ticketSnap.exists
      ? (ticketSnap.data() as GenerationTicket)
      : null;

    // Only a generation still under way is picked up again — a double click,
    // or a reload mid-run. A finished job means the player wants another
    // roadmap, even for the same goal; a failed one already gave its tokens
    // back. Either way the request pays and starts on a fresh ticket.
    if (
      existing &&
      !isTicketExpired(existing) &&
      (!existing.job || existing.job.status === "running")
    ) {
      return { ticket: existing, charged: false, userData: user.data() };
    }

    if (!chargeTokens(tx, user, cost)) return null;

    const ticket: GenerationTicket = {
      id,
      uid,
      goal: goal.trim(),
      level,
      roadmapId: uuidv4(),
      tokensCharged: cost,
      visibility,
      createdAt: new Date().toISOString(),
      draft: null,
      draftUsage: null,
      reviewUsage: null,
      structure: null,
      usage: null,
      context,
      title,
      // A ticket is opened to run a draft, so that is what it is doing.
      progress: { stage: "draft", updatedAt: new Date().toISOString() },
    };
    tx.set(ref, ticket);

    // What the wallet holds once this transaction lands — chargeTokens has
    // queued the write, but the snapshot in hand is from before it.
    const data = user.data() ?? {};
    const userData = {
      ...data,
      [WALLET_FIELD]: spendFromWallet(
        walletFromStored(data[WALLET_FIELD]),
        cost,
      ),
    };
    return { ticket, charged: true, userData };
  });

  if (!result)
    return { ok: false, status: 402, error: "Not enough tokens left" };

  return {
    ok: true,
    ticket: result.ticket,
    charged: result.charged,
    wallet: describeWallet(result.userData),
  };
}

const progressPatch = (stage: GenerationTicketStage) => ({
  progress: { stage, updatedAt: new Date().toISOString() },
});

/**
 * Stage one is in. The draft outlives a failed review on purpose: the tokens
 * bought a plan, and retrying the same goal within the hour reviews the plan
 * already paid for instead of drafting a second one.
 */
export const storeTicketDraft = async (
  id: string,
  draft: StructurePhase[],
  draftUsage: TokenUsage,
): Promise<void> => {
  await ticketRef(id).update({ draft, draftUsage });
};

/**
 * Says what the server is on, for the stage the browser cannot see from
 * outside. Every caller swallows its failures: a progress note is worth one
 * small write and nothing more.
 */
export const markTicketProgress = async (
  id: string,
  stage: GenerationTicketStage,
): Promise<void> => {
  await ticketRef(id).update(progressPatch(stage));
};

/** The ticket as stored, or null when there is none under that id. */
export const readTicket = async (
  id: string,
): Promise<GenerationTicket | null> => {
  const snap = (await ticketRef(id).get()) as DocumentSnapshot;
  return snap.exists ? (snap.data() as GenerationTicket) : null;
};

/** The skeleton is in: from here on the ticket answers for free. */
export const storeTicketStructure = async (
  id: string,
  structure: GeneratedStructure,
  usage: TokenUsage,
  /** What the review stage alone spent, when it ran as its own request. */
  reviewUsage?: TokenUsage,
): Promise<void> => {
  await ticketRef(id).update({
    structure,
    usage,
    ...(reviewUsage ? { reviewUsage } : {}),
    ...progressPatch("done"),
  });
};

/**
 * The generation failed before a skeleton existed: the tokens go back and the
 * ticket goes away, so the next attempt starts clean. Refunds only what the
 * ticket itself charged, and only once — the ticket is deleted in the same
 * transaction.
 */
export async function refundTicket(ticket: GenerationTicket): Promise<void> {
  const ref = ticketRef(ticket.id);
  await firestore.runTransaction(async (tx: Transaction) => {
    const [ticketSnap, user] = (await Promise.all([
      tx.get(ref),
      tx.get(userRef(ticket.uid)),
    ])) as [DocumentSnapshot, DocumentSnapshot];
    if (!ticketSnap.exists) return;

    const data = user.data() ?? {};
    const wallet = walletFromStored(data[WALLET_FIELD]);
    tx.update(user.ref, {
      [WALLET_FIELD]: {
        spent: Math.max(0, wallet.spent - ticket.tokensCharged),
        granted: wallet.granted,
      },
    });
    tx.delete(ref);
  });
}
