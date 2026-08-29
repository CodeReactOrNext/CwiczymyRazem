import type {
  GroupedWork,
  WorkItem,
  WorkStatus,
} from "feature/workBoard/types/workBoard.types";
import { WORK_STATUSES } from "feature/workBoard/types/workBoard.types";

export const isWorkStatus = (value: unknown): value is WorkStatus =>
  WORK_STATUSES.includes(value as WorkStatus);

/**
 * Within a column, `order` decides — the queue is a queue, so the sequence is
 * the information. Ties fall back to the id, which keeps the render stable
 * instead of shuffling when two items were created in the same write.
 */
export const sortWork = (items: WorkItem[]): WorkItem[] =>
  [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

/** Done reads newest-first: what shipped last is what anyone wants to see. */
const sortDone = (items: WorkItem[]): WorkItem[] =>
  [...items].sort(
    (a, b) =>
      (b.completedAt ?? "").localeCompare(a.completedAt ?? "") ||
      a.id.localeCompare(b.id),
  );

export const groupWork = (items: WorkItem[]): GroupedWork => ({
  queue: sortWork(items.filter((item) => item.status === "queue")),
  in_progress: sortWork(items.filter((item) => item.status === "in_progress")),
  done: sortDone(items.filter((item) => item.status === "done")),
});

/** Position for a new item: the back of its column. */
export const nextOrder = (items: WorkItem[], status: WorkStatus): number =>
  items
    .filter((item) => item.status === status)
    .reduce((highest, item) => Math.max(highest, item.order), 0) + 1;

/**
 * The two items whose `order` a move swaps, or null when the item is already at
 * the end it is being pushed towards. Returning the pair rather than a whole
 * reordered list keeps the write to two documents.
 */
export const swapTargets = (
  items: WorkItem[],
  id: string,
  direction: "up" | "down",
): { moved: WorkItem; neighbour: WorkItem } | null => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) return null;

  const column = sortWork(items.filter((c) => c.status === item.status));
  const index = column.findIndex((candidate) => candidate.id === id);
  const neighbour = column[direction === "up" ? index - 1 : index + 1];

  return neighbour ? { moved: item, neighbour } : null;
};
