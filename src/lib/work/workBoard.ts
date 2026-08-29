import type {
  WorkItem,
  WorkStatus,
} from "feature/workBoard/types/workBoard.types";
import {
  isWorkStatus,
  nextOrder,
  swapTargets,
} from "feature/workBoard/utils/workBoard.utils";
import type {
  DocumentReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The work board: what is queued, what is being built, what is done.
 *
 * Kept apart from the roadmap ideas on purpose. An idea is what supporters
 * *want*; a work item is what is actually being built, which includes plenty
 * that nobody voted for — plumbing, bugs, the boring half of any week. The two
 * meet through `ideaId`: pulling an idea into the queue links them, and from
 * then on moving the work item drags the idea's status along, so the board and
 * the roadmap can never tell a supporter two different stories.
 */

const COLLECTION = "workItems";

const TITLE_MAX = 120;
const NOTE_MAX = 400;

/** Plenty for a board a person maintains by hand. */
const LIMIT = 200;

const itemRef = (id: string): DocumentReference =>
  firestore.collection(COLLECTION).doc(id);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const iso = (value: any): string | null => {
  const date = value?.toDate?.();
  return date ? date.toISOString() : null;
};

const toItem = (doc: DocumentSnapshot): WorkItem => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: data.title ?? "",
    note: data.note ?? "",
    status: isWorkStatus(data.status) ? data.status : "queue",
    order: num(data.order),
    ideaId: data.ideaId ?? null,
    updatedAt: iso(data.updatedAt),
    completedAt: iso(data.completedAt),
  };
};

export async function readWorkItems(): Promise<WorkItem[]> {
  const snap = await firestore.collection(COLLECTION).limit(LIMIT).get();
  return (snap.docs as DocumentSnapshot[]).map(toItem);
}

export type WorkResult =
  | { ok: true; items: WorkItem[] }
  | { ok: false; status: 400 | 404; error: string };

/**
 * Keeps a linked roadmap idea in step with the work. Never throws: the board is
 * the source of truth here, and a missing idea should not block a status move.
 */
async function syncLinkedIdea(
  ideaId: string | null,
  status: WorkStatus,
): Promise<void> {
  if (!ideaId) return;

  const ideaStatus =
    status === "done"
      ? "shipped"
      : status === "in_progress"
        ? "in_progress"
        : "planned";

  try {
    await firestore
      .collection("roadmapIdeas")
      .doc(ideaId)
      .update({ status: ideaStatus });
  } catch (error) {
    console.error("[workBoard] could not sync idea", ideaId, error);
  }
}

export async function createWorkItem(input: {
  title?: string;
  note?: string;
  status?: WorkStatus;
  ideaId?: string | null;
}): Promise<WorkResult> {
  const title = (input.title ?? "").trim();
  if (!title) return { ok: false, status: 400, error: "Give it a title" };
  if (title.length > TITLE_MAX) {
    return { ok: false, status: 400, error: "That title is too long" };
  }

  const note = (input.note ?? "").trim().slice(0, NOTE_MAX);
  const status = isWorkStatus(input.status) ? input.status : "queue";
  const items = await readWorkItems();

  await firestore.collection(COLLECTION).add({
    title,
    note,
    status,
    order: nextOrder(items, status),
    ideaId: input.ideaId ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    completedAt: status === "done" ? FieldValue.serverTimestamp() : null,
  });

  await syncLinkedIdea(input.ideaId ?? null, status);

  return { ok: true, items: await readWorkItems() };
}

export async function updateWorkItem(
  id: string,
  patch: { title?: string; note?: string; status?: WorkStatus },
): Promise<WorkResult> {
  if (!id) return { ok: false, status: 400, error: "Missing item" };

  const current = await itemRef(id).get();
  if (!current.exists) return { ok: false, status: 404, error: "Item is gone" };

  const existing = toItem(current);
  const update: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof patch.title === "string") {
    const title = patch.title.trim();
    if (!title) return { ok: false, status: 400, error: "Give it a title" };
    update.title = title.slice(0, TITLE_MAX);
  }

  if (typeof patch.note === "string") {
    update.note = patch.note.trim().slice(0, NOTE_MAX);
  }

  if (patch.status !== undefined) {
    if (!isWorkStatus(patch.status)) {
      return { ok: false, status: 400, error: "Unknown column" };
    }

    if (patch.status !== existing.status) {
      update.status = patch.status;
      // Moving between columns sends the item to the back of the new one, so it
      // never lands in the middle of a queue it was never ordered against.
      update.order = nextOrder(await readWorkItems(), patch.status);
      update.completedAt =
        patch.status === "done" ? FieldValue.serverTimestamp() : null;
    }
  }

  await itemRef(id).update(update);

  if (update.status) await syncLinkedIdea(existing.ideaId, update.status);

  return { ok: true, items: await readWorkItems() };
}

/** Trades an item's position with its neighbour in the same column. */
export async function moveWorkItem(
  id: string,
  direction: "up" | "down",
): Promise<WorkResult> {
  const items = await readWorkItems();
  const swap = swapTargets(items, id, direction);

  // Already at the end it is being pushed towards: nothing to do, and not an
  // error — the button simply had nowhere to go.
  if (!swap) return { ok: true, items };

  const batch = firestore.batch();
  batch.update(itemRef(swap.moved.id), { order: swap.neighbour.order });
  batch.update(itemRef(swap.neighbour.id), { order: swap.moved.order });
  await batch.commit();

  return { ok: true, items: await readWorkItems() };
}

export async function deleteWorkItem(id: string): Promise<WorkResult> {
  if (!id) return { ok: false, status: 400, error: "Missing item" };

  await itemRef(id).delete();
  return { ok: true, items: await readWorkItems() };
}
