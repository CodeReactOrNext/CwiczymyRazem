/** Three columns, and no more — a queue, the thing being built, and the pile behind it. */
export type WorkStatus = "queue" | "in_progress" | "done";

export const WORK_STATUSES: WorkStatus[] = ["queue", "in_progress", "done"];

export interface WorkItem {
  id: string;
  title: string;
  /** Optional line of detail, for when the title alone would be cryptic. */
  note: string;
  status: WorkStatus;
  /** Position within the column. Lower comes first. */
  order: number;
  /** Set when the item was pulled off a supporter's roadmap idea. */
  ideaId: string | null;
  updatedAt: string | null;
  completedAt: string | null;
}

/** The board as the supporter panel renders it. */
export interface GroupedWork {
  queue: WorkItem[];
  in_progress: WorkItem[];
  done: WorkItem[];
}
