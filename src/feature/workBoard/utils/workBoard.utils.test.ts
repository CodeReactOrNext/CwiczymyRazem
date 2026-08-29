import type {
  WorkItem,
  WorkStatus,
} from "feature/workBoard/types/workBoard.types";
import { describe, expect, it } from "vitest";

import {
  groupWork,
  isWorkStatus,
  nextOrder,
  sortWork,
  swapTargets,
} from "./workBoard.utils";

const item = (
  id: string,
  status: WorkStatus,
  order: number,
  completedAt: string | null = null,
): WorkItem => ({
  id,
  title: id,
  note: "",
  status,
  order,
  ideaId: null,
  updatedAt: null,
  completedAt,
});

describe("isWorkStatus", () => {
  it("accepts only the three columns", () => {
    expect(isWorkStatus("queue")).toBe(true);
    expect(isWorkStatus("in_progress")).toBe(true);
    expect(isWorkStatus("done")).toBe(true);
    expect(isWorkStatus("shipped")).toBe(false);
    expect(isWorkStatus(undefined)).toBe(false);
  });
});

describe("sortWork", () => {
  it("puts the lowest order first — the queue is the information", () => {
    expect(
      sortWork([item("c", "queue", 3), item("a", "queue", 1)]).map((i) => i.id),
    ).toEqual(["a", "c"]);
  });

  it("stays stable when two items share an order", () => {
    const items = [item("b", "queue", 1), item("a", "queue", 1)];
    expect(sortWork(items).map((i) => i.id)).toEqual(["a", "b"]);
    expect(sortWork(items.reverse()).map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("groupWork", () => {
  it("splits the board into its three columns", () => {
    const grouped = groupWork([
      item("q", "queue", 1),
      item("w", "in_progress", 1),
      item("d", "done", 1, "2026-08-01T00:00:00.000Z"),
    ]);

    expect(grouped.queue.map((i) => i.id)).toEqual(["q"]);
    expect(grouped.in_progress.map((i) => i.id)).toEqual(["w"]);
    expect(grouped.done.map((i) => i.id)).toEqual(["d"]);
  });

  it("shows what shipped most recently at the top of Done", () => {
    const grouped = groupWork([
      item("old", "done", 1, "2026-01-01T00:00:00.000Z"),
      item("new", "done", 2, "2026-08-01T00:00:00.000Z"),
    ]);

    expect(grouped.done.map((i) => i.id)).toEqual(["new", "old"]);
  });
});

describe("nextOrder", () => {
  it("puts a new item at the back of its own column", () => {
    const items = [item("a", "queue", 1), item("b", "in_progress", 7)];

    expect(nextOrder(items, "queue")).toBe(2);
    expect(nextOrder(items, "in_progress")).toBe(8);
  });

  it("starts at one on an empty column", () => {
    expect(nextOrder([], "queue")).toBe(1);
  });
});

describe("swapTargets", () => {
  const column = [
    item("a", "queue", 1),
    item("b", "queue", 2),
    item("c", "queue", 3),
    item("elsewhere", "done", 1),
  ];

  it("pairs the item with the neighbour it trades places with", () => {
    expect(swapTargets(column, "b", "up")).toMatchObject({
      moved: { id: "b" },
      neighbour: { id: "a" },
    });
    expect(swapTargets(column, "b", "down")).toMatchObject({
      moved: { id: "b" },
      neighbour: { id: "c" },
    });
  });

  it("refuses to move past either end", () => {
    expect(swapTargets(column, "a", "up")).toBeNull();
    expect(swapTargets(column, "c", "down")).toBeNull();
  });

  it("never swaps across columns", () => {
    // "elsewhere" is alone in Done, so it has no neighbour to trade with.
    expect(swapTargets(column, "elsewhere", "up")).toBeNull();
    expect(swapTargets(column, "elsewhere", "down")).toBeNull();
  });

  it("returns nothing for an item that is not there", () => {
    expect(swapTargets(column, "ghost", "up")).toBeNull();
  });
});
