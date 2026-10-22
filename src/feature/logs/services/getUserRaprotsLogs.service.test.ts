import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocs = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  query: vi.fn((...args: unknown[]) => ({ args })),
  where: vi.fn(),
  getDocs: (...args: unknown[]) => getDocs(...args),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

import {
  firebaseGetUserRaprotsLogs,
  invalidateActivityLogsCache,
  peekUserRaprotsLogs,
} from "./getUserRaprotsLogs.service";

const snapshotOf = (ids: string[]) => ({
  forEach: (fn: (doc: { id: string; data: () => object }) => void) =>
    ids.forEach((id) => fn({ id, data: () => ({ reportDate: id }) })),
});

const ALL_IDS = [
  "2025-06-01T10:00:00.000Z",
  "2026-03-01T10:00:00.000Z",
  "2026-09-01T10:00:00.000Z",
];

describe("firebaseGetUserRaprotsLogs", () => {
  beforeEach(() => {
    getDocs.mockReset();
    invalidateActivityLogsCache("uid-1");
  });

  it("shares one download between callers that ask at the same time", async () => {
    getDocs.mockResolvedValue(snapshotOf(ALL_IDS));

    const [a, b] = await Promise.all([
      firebaseGetUserRaprotsLogs("uid-1", "all"),
      firebaseGetUserRaprotsLogs("uid-1", "all"),
    ]);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("answers a year from the all-time read already on its way", async () => {
    getDocs.mockResolvedValue(snapshotOf(ALL_IDS));

    const [, year] = await Promise.all([
      firebaseGetUserRaprotsLogs("uid-1", "all"),
      firebaseGetUserRaprotsLogs("uid-1", 2026),
    ]);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(year.map((log) => log.id)).toEqual(ALL_IDS.slice(1));
  });

  it("peeks a year out of the cached all-time logs", async () => {
    getDocs.mockResolvedValue(snapshotOf(ALL_IDS));
    await firebaseGetUserRaprotsLogs("uid-1", "all");

    expect(peekUserRaprotsLogs("uid-1", 2025)?.map((log) => log.id)).toEqual([ALL_IDS[0]]);
  });

  it("downloads again after an invalidation", async () => {
    getDocs.mockResolvedValue(snapshotOf(ALL_IDS));
    await firebaseGetUserRaprotsLogs("uid-1", "all");
    invalidateActivityLogsCache("uid-1");
    await firebaseGetUserRaprotsLogs("uid-1", "all");

    expect(getDocs).toHaveBeenCalledTimes(2);
  });
});
