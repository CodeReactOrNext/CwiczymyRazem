import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import {
  countRoadmapPlayers,
  POPULARITY_TTL_MS,
  readRoadmapPopularity,
} from "./roadmapPopularity";

const NOW = Date.parse("2026-11-23T12:00:00.000Z");

/** Just enough of the Admin Firestore for these functions. */
const fakeDb = (
  progress: { roadmapId: string }[],
  stats: Record<string, { players: number; countedAt: string }> = {},
) => {
  const written: Record<string, { players: number; countedAt: string }> = {};
  let counted = 0;
  const db = {
    collection: (name: string) => ({
      where: (_field: string, _op: string, roadmapId: string) => ({
        count: () => ({
          get: async () => {
            counted++;
            return {
              data: () => ({
                count: progress.filter((p) => p.roadmapId === roadmapId).length,
              }),
            };
          },
        }),
      }),
      doc: (id: string) => ({ name, id }),
    }),
    getAll: async (...refs: { id: string }[]) =>
      refs.map((ref) => ({ data: () => stats[ref.id] })),
    batch: () => ({
      set: (
        ref: { id: string },
        data: { players: number; countedAt: string },
      ) => {
        written[ref.id] = data;
      },
      commit: async () => {},
    }),
  };
  return {
    db: db as unknown as Firestore,
    written,
    counted: () => counted,
  };
};

const PROGRESS = [
  { roadmapId: "rhythm" },
  { roadmapId: "rhythm" },
  { roadmapId: "mayer" },
];

describe("countRoadmapPlayers", () => {
  it("counts the progress documents of each roadmap", async () => {
    const { db } = fakeDb(PROGRESS);
    expect(await countRoadmapPlayers(db, ["rhythm", "mayer", "new"])).toEqual({
      rhythm: 2,
      mayer: 1,
      new: 0,
    });
  });
});

describe("readRoadmapPopularity", () => {
  it("serves a fresh stored count without counting again", async () => {
    const { db, counted, written } = fakeDb(PROGRESS, {
      rhythm: { players: 40, countedAt: new Date(NOW - 1000).toISOString() },
    });
    expect(await readRoadmapPopularity(db, ["rhythm"], NOW)).toEqual({
      rhythm: 40,
    });
    expect(counted()).toBe(0);
    expect(written).toEqual({});
  });

  it("recounts and stores what is missing or older than a day", async () => {
    const { db, counted, written } = fakeDb(PROGRESS, {
      rhythm: {
        players: 40,
        countedAt: new Date(NOW - POPULARITY_TTL_MS - 1).toISOString(),
      },
    });
    expect(await readRoadmapPopularity(db, ["rhythm", "mayer"], NOW)).toEqual({
      rhythm: 2,
      mayer: 1,
    });
    expect(counted()).toBe(2);
    expect(written.rhythm.players).toBe(2);
    expect(written.mayer.countedAt).toBe(new Date(NOW).toISOString());
  });
});
