import { beforeEach, describe, expect, it, vi } from "vitest";

/** Collections the fake Firestore serves, keyed by document id. */
const collections: Record<string, Record<string, Record<string, any>>> = {
  roadmaps: {},
  userRoadmapProgress: {},
  users: {},
};

const snapshot = (collection: string, id: string) => ({
  id,
  exists: id in collections[collection],
  data: () => collections[collection][id],
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: (name: string) => ({
      get: async () => ({
        docs: Object.keys(collections[name]).map((id) => snapshot(name, id)),
      }),
      doc: (id: string) => ({
        __collection: name,
        __id: id,
        get: async () => snapshot(name, id),
      }),
    }),
    getAll: async (...refs: { __collection: string; __id: string }[]) =>
      refs.map((ref) => snapshot(ref.__collection, ref.__id)),
  },
}));

const { getUserRoadmap, listUserRoadmaps } =
  await import("lib/roadmaps/userRoadmaps");

const generatedRoadmap = (overrides: Record<string, any> = {}) => ({
  id: "gen-1",
  userId: "u1",
  title: "Plan: shred",
  goal: "Shred",
  level: "Advanced",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  phases: [
    {
      id: "p1",
      title: "Phase one",
      order: 0,
      steps: [
        {
          id: "g-s1",
          title: "Alternate picking",
          description: "Start slow.",
          successCriteria: "",
          sessionsRequired: 2,
          sessionsCompleted: 2,
          order: 0,
          suggestedExerciseId: "ex-1",
          suggestedLessonIds: ["yt-1", "yt-2"],
        },
        {
          id: "g-s2",
          title: "String skipping",
          description: "",
          successCriteria: "",
          sessionsRequired: 3,
          sessionsCompleted: 1,
          order: 1,
        },
      ],
    },
  ],
  ...overrides,
});

beforeEach(() => {
  collections.roadmaps = {};
  collections.userRoadmapProgress = {};
  collections.users = {
    u1: { displayName: "Ann", avatar: "ann.png" },
    u2: { displayName: "Bo", avatar: null },
  };
});

describe("listUserRoadmaps", () => {
  it("counts the progress the generator wrote into the roadmap itself", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();

    const [row] = await listUserRoadmaps();

    expect(row.displayName).toBe("Ann");
    expect(row.stepCount).toBe(2);
    expect(row.exerciseSteps).toBe(1);
    expect(row.lessonSteps).toBe(1);
    // Only the first step covers its required sessions.
    expect(row.completedSteps).toBe(1);
    expect(row.sessionsCompleted).toBe(3);
    // Nothing in userRoadmapProgress, so the roadmap was never practised in
    // the shape the app writes today.
    expect(row.lastPractisedAt).toBeNull();
  });

  it("lets a progress document override the inline counters", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u1_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u1",
      updatedAt: "2026-03-01T00:00:00.000Z",
      stepProgress: { "g-s2": 3 },
    };

    const [row] = await listUserRoadmaps();

    expect(row.completedSteps).toBe(2);
    expect(row.sessionsCompleted).toBe(5);
    expect(row.lastPractisedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("lists only the generated roadmaps, never the curated ones behind a progress document", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    // A curated roadmap from src/data/roadmaps that two players started.
    collections.userRoadmapProgress["u1_curated-1"] = {
      roadmapId: "curated-1",
      userId: "u1",
      updatedAt: "2026-04-01T00:00:00.000Z",
      stepProgress: { "c-s1": 2 },
    };
    collections.userRoadmapProgress["u2_curated-1"] = {
      roadmapId: "curated-1",
      userId: "u2",
      updatedAt: "2026-04-02T00:00:00.000Z",
      stepProgress: { "c-s1": 1 },
    };

    const rows = await listUserRoadmaps();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("gen-1");
  });

  it("sorts the newest activity first", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.roadmaps["gen-2"] = generatedRoadmap({
      id: "gen-2",
      userId: "u2",
      updatedAt: "2026-05-01T00:00:00.000Z",
    });

    const rows = await listUserRoadmaps();

    expect(rows.map((row) => row.id)).toEqual(["gen-2", "gen-1"]);
    expect(rows.map((row) => row.rowId)).toEqual(["u2_gen-2", "u1_gen-1"]);
  });
});

describe("followers", () => {
  it("counts the other players who started a roadmap, not its owner", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u1_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u1",
      stepProgress: {},
    };
    collections.userRoadmapProgress["u2_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u2",
      stepProgress: {},
    };

    const [row] = await listUserRoadmaps("u3");

    expect(row.followerCount).toBe(1);
    expect(row.viewerProgress).toBeNull();
  });

  it("gives a follower their own run, without the owner's inline counters", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u2_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u2",
      startedAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      stepProgress: { "g-s2": 3 },
    };

    const [row] = await listUserRoadmaps("u2");

    expect(row.viewerProgress).toEqual({
      completedSteps: 1,
      sessionsCompleted: 3,
      startedAt: "2026-06-01T00:00:00.000Z",
      lastPractisedAt: "2026-06-02T00:00:00.000Z",
    });
    // The owner's numbers on the row are untouched.
    expect(row.sessionsCompleted).toBe(3);
    expect(row.completedSteps).toBe(1);
  });

  it("loads the viewer's run on a followed roadmap, and never a third player's", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u2_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u2",
      stepProgress: { "g-s1": 1 },
    };

    const mine = await getUserRoadmap("gen-1", "u2");
    expect(mine?.stepProgress).toEqual({ "g-s1": 1 });

    // A third player sees an empty map: neither the owner's run nor u2's.
    const other = await getUserRoadmap("gen-1", "u3");
    expect(other?.stepProgress).toEqual({});
    expect(other?.phaseChecks).toEqual({});
  });

  it("never hands the owner's embedded counters to anyone else", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap({
      phases: [
        {
          ...generatedRoadmap().phases[0],
          check: { passedAt: "2026-01-05", attempts: 1, bestScore: 5, total: 5 },
        },
      ],
    });

    const detail = await getUserRoadmap("gen-1", "u2");
    const [phase] = detail!.roadmap.phases;

    expect(phase.check).toBeUndefined();
    expect(phase.steps.map((step) => step.sessionsCompleted)).toEqual([0, 0]);
    expect(detail?.summary.viewerProgress).toBeNull();
  });
});

describe("getUserRoadmap", () => {
  it("returns a stored roadmap with the merged progress", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u1_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u1",
      stepProgress: { "g-s2": 3 },
    };

    const detail = await getUserRoadmap("gen-1", "u1");

    expect(detail?.summary.displayName).toBe("Ann");
    expect(detail?.roadmap.phases[0].steps).toHaveLength(2);
    expect(detail?.stepProgress).toEqual({ "g-s1": 2, "g-s2": 3 });
  });

  it("answers nothing for an id that is not a generated roadmap", async () => {
    expect(await getUserRoadmap("curated-1", "u1")).toBeNull();
  });

  it("ignores whose progress the request would like: it is the viewer's", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    collections.userRoadmapProgress["u1_gen-1"] = {
      roadmapId: "gen-1",
      userId: "u1",
      stepProgress: { "g-s2": 3 },
    };

    expect((await getUserRoadmap("gen-1", "u2"))?.stepProgress).toEqual({});
  });
});

describe("private roadmaps", () => {
  it("lists a private roadmap to its owner and to nobody else", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap({ visibility: "private" });
    collections.roadmaps["gen-2"] = generatedRoadmap({
      id: "gen-2",
      userId: "u2",
      visibility: "public",
    });

    expect((await listUserRoadmaps("u1")).map((row) => row.id)).toEqual([
      "gen-2",
      "gen-1",
    ]);
    expect((await listUserRoadmaps("u2")).map((row) => row.id)).toEqual([
      "gen-2",
    ]);
    expect((await listUserRoadmaps()).map((row) => row.id)).toEqual(["gen-2"]);
  });

  it("carries the visibility on the row, public when never chosen", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap();
    const [row] = await listUserRoadmaps("u1");
    expect(row.visibility).toBe("public");
  });

  it("answers not found for somebody else's private roadmap", async () => {
    collections.roadmaps["gen-1"] = generatedRoadmap({ visibility: "private" });

    expect(await getUserRoadmap("gen-1", "u2")).toBeNull();
    expect((await getUserRoadmap("gen-1", "u1"))?.summary.visibility).toBe(
      "private",
    );
  });
});
