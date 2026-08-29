import { EFFECT_TYPES } from "feature/gearProposals/constants/gearProposal.constants";
import type {
  GearBoard,
  GearKind,
  GearProposal,
  ProposalStatus,
} from "feature/gearProposals/types/gearProposal.types";
import { PROPOSAL_STATUSES } from "feature/gearProposals/types/gearProposal.types";
import {
  effectTypeFor,
  GEAR_BRAND_MAX,
  GEAR_DESCRIPTION_MAX,
  GEAR_INSCRIPTION_MAX,
  GEAR_NAME_MAX,
  isGearKind,
  isProposableRarity,
  rankProposals,
  safeImageUrl,
  sanitizeScrapBom,
} from "feature/gearProposals/utils/gearProposal.utils";
import {
  GEAR_BACK_COST,
  GEAR_PROPOSAL_COST,
  MAX_BACKING_PER_GEAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type { Backer } from "feature/supporterPanel/types/supporterPanel.types";
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
 * Gear proposals: the Arsenal's own suggestion box.
 *
 * Kept apart from the roadmap because it is a different kind of ask. A roadmap
 * idea is a feature request; this is a spec — a name, a rarity, a picture, what
 * it breaks down into on the bench — and the fields only make sense against the
 * Arsenal's own vocabulary. Sharing a board would have meant a form that is
 * mostly blank whichever kind you picked.
 *
 * The voting half is the same as the roadmap's, and shares its code: tokens
 * burn, the per-item cap holds, and the wallet is re-read inside the write.
 */

const PROPOSALS_COLLECTION = "gearProposals";
const BACKING_COLLECTION = "gearVotes";

const BOARD_LIMIT = 300;

const proposalRef = (id: string): DocumentReference =>
  firestore.collection(PROPOSALS_COLLECTION).doc(id);

const backingRef = (uid: string): DocumentReference =>
  firestore.collection(BACKING_COLLECTION).doc(uid);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toProposal = (doc: DocumentSnapshot, backers: Backer[]): GearProposal => {
  const data = doc.data() ?? {};
  const createdAt = data.createdAt?.toDate?.() ?? null;
  const kind: GearKind = isGearKind(data.kind) ? data.kind : "guitar";

  return {
    id: doc.id,
    kind,
    name: data.name ?? "",
    brand: data.brand ?? "",
    effectType: effectTypeFor(kind, data.effectType, EFFECT_TYPES),
    rarity: isProposableRarity(data.rarity) ? data.rarity : "Common",
    description: data.description ?? "",
    // Re-checked on the way out, not just on the way in: a link that was
    // written before this rule existed must not reach an <img> either.
    imageUrl: safeImageUrl(data.imageUrl),
    inscription: data.inscription ?? "",
    scrapBom: sanitizeScrapBom(kind, data.scrapBom),
    status: PROPOSAL_STATUSES.includes(data.status as ProposalStatus)
      ? (data.status as ProposalStatus)
      : "open",
    authorUid: data.authorUid ?? "",
    authorName: data.authorName ?? "Supporter",
    voteCount: num(data.voteCount),
    backerCount: num(data.backerCount),
    backers,
    createdAt: createdAt ? createdAt.toISOString() : new Date(0).toISOString(),
  };
};

export async function readGearBoard(
  session: SupporterSession,
): Promise<GearBoard> {
  const [snap, backing, user] = await Promise.all([
    firestore.collection(PROPOSALS_COLLECTION).limit(BOARD_LIMIT).get(),
    readBoardBacking(BACKING_COLLECTION, session.uid),
    userRef(session.uid).get(),
  ]);

  const proposals = (snap.docs as DocumentSnapshot[]).map((doc) =>
    toProposal(doc, backing.byItem[doc.id] ?? []),
  );

  return {
    proposals: rankProposals(proposals),
    myBacking: backing.mine,
    myUid: session.uid,
    wallet: describeWallet(user.data()),
    isOwner: session.isOwner,
  };
}

export type GearResult =
  | { ok: true; board: GearBoard }
  | { ok: false; status: 400 | 402 | 403 | 404; error: string };

export interface GearProposalInput {
  kind?: GearKind;
  name?: string;
  brand?: string;
  effectType?: string;
  rarity?: string;
  description?: string;
  imageUrl?: string;
  inscription?: string;
  scrapBom?: unknown;
}

/** Posts a proposal and burns the tokens for it in one transaction. */
export async function proposeGear(
  session: SupporterSession,
  input: GearProposalInput,
): Promise<GearResult> {
  const kind: GearKind = isGearKind(input.kind) ? input.kind : "guitar";
  const name = (input.name ?? "").trim();

  if (!name) return { ok: false, status: 400, error: "Give the gear a name" };
  if (name.length > GEAR_NAME_MAX) {
    return { ok: false, status: 400, error: "That name is too long" };
  }
  if (!isProposableRarity(input.rarity)) {
    return { ok: false, status: 400, error: "Pick a rarity" };
  }

  const description = (input.description ?? "").trim();
  if (description.length > GEAR_DESCRIPTION_MAX) {
    return { ok: false, status: 400, error: "That description is too long" };
  }

  const inscription = (input.inscription ?? "").trim();
  if (inscription.length > GEAR_INSCRIPTION_MAX) {
    return {
      ok: false,
      status: 400,
      error: `An engraving is ${GEAR_INSCRIPTION_MAX} characters at most`,
    };
  }

  const newRef: DocumentReference = firestore
    .collection(PROPOSALS_COLLECTION)
    .doc();

  const posted = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    if (!chargeTokens(tx, user, GEAR_PROPOSAL_COST)) return false;

    tx.set(newRef, {
      kind,
      name,
      brand: (input.brand ?? "").trim().slice(0, GEAR_BRAND_MAX),
      effectType: effectTypeFor(kind, input.effectType, EFFECT_TYPES),
      rarity: input.rarity,
      description,
      imageUrl: safeImageUrl(input.imageUrl),
      inscription,
      scrapBom: sanitizeScrapBom(kind, input.scrapBom),
      status: "open",
      authorUid: session.uid,
      authorName: session.displayName,
      voteCount: 0,
      backerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!posted) {
    return {
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    };
  }

  return { ok: true, board: await readGearBoard(session) };
}

/** Burns tokens onto a proposal. Same rules as backing a roadmap idea. */
export async function backProposal(
  session: SupporterSession,
  proposalId: string,
  amount: number,
): Promise<GearResult> {
  if (!proposalId) return { ok: false, status: 400, error: "Missing proposal" };
  if (!Number.isInteger(amount) || amount < 1) {
    return { ok: false, status: 400, error: "Back it by at least one" };
  }

  const outcome = await backWithTokens({
    uid: session.uid,
    itemId: proposalId,
    refs: {
      item: proposalRef(proposalId),
      ledger: backingRef(session.uid),
    },
    amount,
    cap: MAX_BACKING_PER_GEAR,
    costPerPoint: GEAR_BACK_COST,
    backer: { name: session.displayName, avatar: session.avatar },
  });

  if (outcome !== "ok") {
    return {
      ok: false,
      ...backingError(outcome, MAX_BACKING_PER_GEAR, "That proposal is gone"),
    };
  }

  return { ok: true, board: await readGearBoard(session) };
}

/** Owner only: accepted → in the game, or turned down. */
export async function setProposalStatus(
  session: SupporterSession,
  proposalId: string,
  status: ProposalStatus,
): Promise<GearResult> {
  if (!session.isOwner) return { ok: false, status: 403, error: "Owner only" };
  if (!proposalId || !PROPOSAL_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: "Unknown status" };
  }
  if (!(await proposalRef(proposalId).get()).exists) {
    return { ok: false, status: 404, error: "That proposal is gone" };
  }

  await proposalRef(proposalId).update({ status });
  return { ok: true, board: await readGearBoard(session) };
}
