// @vitest-environment jsdom
import type * as ReactQuery from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type {
  UserRoadmapDetail,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import { afterEach, describe, expect, it, vi } from "vitest";

const summary: UserRoadmapSummary = {
  rowId: "u1_gen-1",
  id: "gen-1",
  userId: "u1",
  displayName: "Ann",
  avatar: null,
  title: "Plan: shred",
  goal: "Shred like Friedman",
  level: "Advanced",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  phaseCount: 1,
  stepCount: 2,
  describedSteps: 2,
  exerciseSteps: 0,
  songSteps: 0,
  lessonSteps: 0,
  completedSteps: 1,
  sessionsCompleted: 3,
  lastPractisedAt: "2026-02-01T00:00:00.000Z",
  checkpointsPassed: 0,
  visibility: "public",
  followerCount: 2,
  viewerProgress: null,
};

const detail: UserRoadmapDetail = {
  summary,
  roadmap: {
    id: "gen-1",
    userId: "u1",
    title: "Plan: shred",
    goal: "Shred like Friedman",
    level: "Advanced",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    phases: [
      {
        id: "p1",
        title: "Picking",
        order: 0,
        steps: [
          {
            id: "s1",
            title: "Alternate picking",
            description: "Start slow.",
            successCriteria: "Clean at 120bpm",
            sessionsRequired: 2,
            sessionsCompleted: 0,
            order: 0,
          },
          {
            id: "s2",
            title: "String skipping",
            description: "Mind the muting.",
            successCriteria: "No stray strings",
            sessionsRequired: 3,
            sessionsCompleted: 0,
            order: 1,
          },
        ],
      },
    ],
  },
  stepProgress: { s1: 2, s2: 1 },
  phaseChecks: {},
};

const ownSummary: UserRoadmapSummary = {
  ...summary,
  rowId: "viewer-uid_own-1",
  id: "own-1",
  userId: "viewer-uid",
  displayName: "You",
  goal: "My own roadmap",
  completedSteps: 0,
  sessionsCompleted: 0,
  lastPractisedAt: null,
};

const ownDetail: UserRoadmapDetail = {
  ...detail,
  summary: ownSummary,
  roadmap: { ...detail.roadmap, id: "own-1", userId: "viewer-uid" },
};

vi.mock("feature/supporterPanel/hooks/useUserRoadmaps", () => ({
  USER_ROADMAPS_KEY: ["user-roadmaps"],
  useUserRoadmaps: () => ({ data: [summary, ownSummary], isLoading: false }),
  useUserRoadmapDetail: (id: string) => ({
    data: id === "own-1" ? ownDetail : detail,
    isLoading: false,
  }),
}));

const updateRoadmap = vi.fn();
const saveRoadmap = vi.fn();
vi.mock("feature/aiCoach/services/roadmap.service", () => ({
  firebaseUpdateRoadmap: (...args: unknown[]) => updateRoadmap(...args),
  firebaseSaveRoadmap: (...args: unknown[]) => saveRoadmap(...args),
}));
vi.mock("feature/aiCoach/services/youtubeLesson.service", () => ({
  firebaseGetLessonsByIds: async () => [],
}));
const updateUserProgress = vi.fn();
const startRoadmap = vi.fn(async (..._args: unknown[]) => {});
vi.mock("feature/aiCoach/services/userProgress.service", () => ({
  firebaseUpdateUserProgress: (...args: unknown[]) =>
    updateUserProgress(...args),
  firebaseStartRoadmap: (...args: unknown[]) => startRoadmap(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    pathname: "/supporter",
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));
// The row's owner ("u1") is never the viewer here, so every existing test
// keeps exercising the read-only path; the "own roadmap" test below sets its
// own summary with a matching userId instead of changing this default.
vi.mock("store/hooks", () => ({
  useAppSelector: () => "viewer-uid",
}));
// No QueryClientProvider in these tests — invalidate/read are no-ops here;
// the "own roadmap" test checks the real cache update through the real hook.
const invalidateQueries = vi.fn();
const getQueryData = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof ReactQuery>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
      getQueryData,
      setQueryData: vi.fn(),
    }),
  };
});

const { UserRoadmapsTab } =
  await import("feature/supporterPanel/components/UserRoadmapsTab");

afterEach(cleanup);

describe("UserRoadmapsTab", () => {
  it("lists a player's roadmap with their progress", () => {
    render(<UserRoadmapsTab enabled />);

    expect(screen.getByText("Shred like Friedman")).toBeDefined();
    expect(screen.getByText("Ann")).toBeDefined();
    expect(screen.getByText(/1\/2 steps · 3 sessions/)).toBeDefined();
  });

  it("puts the viewer's own roadmaps in a section of their own", () => {
    render(<UserRoadmapsTab enabled />);

    expect(screen.getByText("Your roadmaps")).toBeDefined();
    expect(screen.getByText("From other players")).toBeDefined();
  });

  it("opens the roadmap in the same map /ai-coach draws", () => {
    render(<UserRoadmapsTab enabled />);

    fireEvent.click(screen.getByText("Shred like Friedman"));

    // The phase spine and every step of the map, not the summary row.
    expect(screen.getAllByText("Picking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alternate picking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("String skipping").length).toBeGreaterThan(0);
    // The banner names the player whose roadmap it is.
    expect(screen.getAllByText("Ann").length).toBeGreaterThan(0);
  });

  it("never writes to the roadmap it is showing", () => {
    render(<UserRoadmapsTab enabled />);
    fireEvent.click(screen.getByText("Shred like Friedman"));

    // Opening a step is the interaction that would persist on /ai-coach.
    fireEvent.click(screen.getAllByText("Alternate picking")[0]);

    expect(updateRoadmap).not.toHaveBeenCalled();
  });

  it("shows how many players follow a roadmap", () => {
    render(<UserRoadmapsTab enabled />);

    expect(screen.getAllByText(/2 players following/).length).toBeGreaterThan(
      0,
    );
  });

  it("starts somebody else's roadmap under the viewer's own uid", async () => {
    render(<UserRoadmapsTab enabled />);
    fireEvent.click(screen.getByText("Shred like Friedman"));

    fireEvent.click(screen.getByText("Start this roadmap"));

    await vi.waitFor(() =>
      expect(startRoadmap).toHaveBeenCalledWith("viewer-uid", "gen-1"),
    );
    await screen.findByText(/You are working through/);
    expect(screen.queryByText("Start this roadmap")).toBeNull();
  });

  it("treats the viewer's own generated roadmap as writable, with no read-only notice", () => {
    render(<UserRoadmapsTab enabled />);

    fireEvent.click(screen.getByText("My own roadmap"));

    expect(screen.queryByText(/Somebody else.s roadmap/)).toBeNull();
    expect(screen.queryByText("Start this roadmap")).toBeNull();
  });
});
