import {
  IDEA_BACK_COST,
  IDEA_COST,
  IDEA_DESCRIPTION_MAX,
  IDEA_TITLE_MAX,
  MAX_BACKING_PER_IDEA,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type {
  Backer,
  RoadmapBoard,
  RoadmapIdea,
  RoadmapIdeaIcon,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import {
  DEFAULT_ROADMAP_IDEA_ICON,
  ROADMAP_IDEA_ICONS,
  ROADMAP_IDEA_STATUSES,
} from "feature/supporterPanel/types/supporterPanel.types";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  backingError,
  backWithTokens,
  readBoardBacking,
} from "lib/support/backing";
import type { SupporterSession } from "lib/support/supporterAuth";
import { chargeTokens, describeWallet, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The supporter roadmap board.
 *
 * Backing an idea burns tokens, and burned is burned — there is no taking it
 * back. That is the price of one universal currency: influence has to be spent
 * to mean anything, and a token that could be reclaimed would be worth nothing
 * to spend anywhere else. What keeps it fair is the price of a token, so a
 * board a supporter shaped in March is not the last word they ever get.
 */

const IDEAS_COLLECTION = "roadmapIdeas";
const BACKING_COLLECTION = "roadmapVotes";

/** Enough to hold a board people actually read; ranking happens in memory. */
const BOARD_LIMIT = 300;

const ideaRef = (ideaId: string): DocumentReference =>
  firestore.collection(IDEAS_COLLECTION).doc(ideaId);

const backingRef = (uid: string): DocumentReference =>
  firestore.collection(BACKING_COLLECTION).doc(uid);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** Anything off the list falls back to the bulb rather than failing the write. */
const safeIcon = (icon: unknown): RoadmapIdeaIcon =>
  ROADMAP_IDEA_ICONS.includes(icon as RoadmapIdeaIcon)
    ? (icon as RoadmapIdeaIcon)
    : DEFAULT_ROADMAP_IDEA_ICON;

const toIdea = (doc: DocumentSnapshot, backers: Backer[]): RoadmapIdea => {
  const data = doc.data() ?? {};
  const createdAt = data.createdAt?.toDate?.() ?? null;

  return {
    id: doc.id,
    title: data.title ?? "",
    description: data.description ?? "",
    status: (data.status ?? "open") as RoadmapIdeaStatus,
    icon: safeIcon(data.icon),
    authorUid: data.authorUid ?? "",
    authorName: data.authorName ?? "Supporter",
    authorAvatar: data.authorAvatar ?? null,
    voteCount: num(data.voteCount),
    backerCount: num(data.backerCount),
    backers,
    createdAt: createdAt ? createdAt.toISOString() : new Date(0).toISOString(),
  };
};

/** Most backed first; a tie goes to whoever posted first. */
const rankIdeas = (ideas: RoadmapIdea[]): RoadmapIdea[] =>
  [...ideas].sort(
    (a, b) =>
      b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt),
  );

export async function readBoard(
  session: SupporterSession,
): Promise<RoadmapBoard> {
  const [ideasSnap, backing, user] = await Promise.all([
    firestore.collection(IDEAS_COLLECTION).limit(BOARD_LIMIT).get(),
    readBoardBacking(BACKING_COLLECTION, session.uid),
    userRef(session.uid).get(),
  ]);

  const ideas = (ideasSnap.docs as DocumentSnapshot[]).map((doc) =>
    toIdea(doc, backing.byItem[doc.id] ?? []),
  );

  return {
    ideas: rankIdeas(ideas),
    myBacking: backing.mine,
    myUid: session.uid,
    wallet: describeWallet(user.data()),
    isOwner: session.isOwner,
  };
}

export type BoardResult =
  | { ok: true; board: RoadmapBoard }
  | { ok: false; status: 400 | 402 | 403 | 404; error: string };

const NOT_ENOUGH_TOKENS = {
  ok: false as const,
  status: 402 as const,
  error: "Not enough tokens left",
};

/**
 * Posts an idea and burns the tokens for it in one transaction, so a double
 * click (or a second tab) cannot get two ideas out of one wallet.
 */
export async function createIdea(
  session: SupporterSession,
  input: { title?: string; description?: string; icon?: RoadmapIdeaIcon },
): Promise<BoardResult> {
  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();

  if (!title) return { ok: false, status: 400, error: "Give the idea a title" };
  if (title.length > IDEA_TITLE_MAX) {
    return { ok: false, status: 400, error: "That title is too long" };
  }
  if (description.length > IDEA_DESCRIPTION_MAX) {
    return { ok: false, status: 400, error: "That description is too long" };
  }

  const authorRef = userRef(session.uid);
  const newIdeaRef: DocumentReference = firestore
    .collection(IDEAS_COLLECTION)
    .doc();

  const posted = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(authorRef);
    if (!chargeTokens(tx, user, IDEA_COST)) return false;

    tx.set(newIdeaRef, {
      title,
      description,
      status: "open",
      icon: safeIcon(input.icon),
      authorUid: session.uid,
      authorName: session.displayName,
      authorAvatar: session.avatar,
      voteCount: 0,
      backerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!posted) return NOT_ENOUGH_TOKENS;

  return { ok: true, board: await readBoard(session) };
}

/**
 * Burns tokens to push an idea up. `amount` is the weight to add now, not a
 * target: a replayed request charges again rather than silently doing nothing,
 * which is the honest reading of "spend a token".
 */
export async function backIdea(
  session: SupporterSession,
  ideaId: string,
  amount: number,
): Promise<BoardResult> {
  if (!ideaId) return { ok: false, status: 400, error: "Missing idea" };
  if (!Number.isInteger(amount) || amount < 1) {
    return { ok: false, status: 400, error: "Back an idea by at least one" };
  }

  const outcome = await backWithTokens({
    uid: session.uid,
    itemId: ideaId,
    refs: { item: ideaRef(ideaId), ledger: backingRef(session.uid) },
    amount,
    cap: MAX_BACKING_PER_IDEA,
    costPerPoint: IDEA_BACK_COST,
    backer: { name: session.displayName, avatar: session.avatar },
  });

  if (outcome !== "ok") {
    return {
      ok: false,
      ...backingError(outcome, MAX_BACKING_PER_IDEA, "That idea is gone"),
    };
  }

  return { ok: true, board: await readBoard(session) };
}

/** Owner only: moves an idea along the board (planned → in progress → shipped). */
export async function setIdeaStatus(
  session: SupporterSession,
  ideaId: string,
  status: RoadmapIdeaStatus,
): Promise<BoardResult> {
  if (!session.isOwner) return { ok: false, status: 403, error: "Owner only" };
  if (!ideaId || !ROADMAP_IDEA_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: "Unknown status" };
  }
  if (!(await ideaRef(ideaId).get()).exists) {
    return { ok: false, status: 404, error: "That idea is gone" };
  }

  await ideaRef(ideaId).update({ status });
  return { ok: true, board: await readBoard(session) };
}
