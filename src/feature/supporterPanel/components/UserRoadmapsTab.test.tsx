// @vitest-environment jsdom
import type * as ReactQuery from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type {
  UserRoadmapDetail,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import { afterEach, describe, expect, it, vi } from "vitest";

// jsdom ships no ResizeObserver, which the map's road measures its width with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

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
  phaseSteps: [2],
  phaseDone: [1],
  firstStep: "Alternate picking",
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
  resourceProgress: {},
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
  phaseDone: [0],
  nextStep: "String skipping",
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
  useAppDispatch: () => vi.fn(),
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
  it("lists a player's roadmap without their progress", () => {
    render(<UserRoadmapsTab enabled section='board' />);

    expect(screen.getByText("Plan: shred")).toBeDefined();
    expect(screen.getByText("Ann")).toBeDefined();
    // Ann's finished step is hers: the viewer never started this roadmap.
    expect(screen.getByLabelText("0 of 2 steps completed")).toBeDefined();
    expect(screen.getByText("View roadmap")).toBeDefined();
  });

  it("keeps the viewer's own roadmaps and the board apart", () => {
    const { unmount } = render(<UserRoadmapsTab enabled section='own' />);
    expect(screen.getByText("Built for you")).toBeDefined();
    expect(screen.queryByText("Ann")).toBeNull();
    unmount();

    render(<UserRoadmapsTab enabled section='board' />);
    expect(screen.queryByText("Built for you")).toBeNull();
    expect(screen.getByText("Ann")).toBeDefined();
  });

  it("lists a curated roadmap the viewer started among their own", () => {
    render(
      <UserRoadmapsTab
        enabled
        section='own'
        extraOwn={[
          {
            key: "curated:rhythm",
            lastAt: "2026-03-01T00:00:00.000Z",
            underWay: true,
            render: (featured) => (
              <p>{featured ? "Rhythm, featured" : "Rhythm"}</p>
            ),
          },
        ]}
      />,
    );

    // Under way, so it goes up front, ahead of the untouched own roadmap.
    expect(screen.getByText("Rhythm, featured")).toBeDefined();
    expect(screen.getByText("Built for you")).toBeDefined();
  });

  it("opens the roadmap in the same map /ai-coach draws", () => {
    render(<UserRoadmapsTab enabled section='board' />);

    fireEvent.click(screen.getByText("Plan: shred"));

    // The phase spine and every step of the map, not the summary row.
    expect(screen.getAllByText("Picking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alternate picking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("String skipping").length).toBeGreaterThan(0);
    // The banner names the player whose roadmap it is.
    expect(screen.getAllByText("Ann").length).toBeGreaterThan(0);
  });

  it("never writes to the roadmap it is showing", () => {
    render(<UserRoadmapsTab enabled section='board' />);
    fireEvent.click(screen.getByText("Plan: shred"));

    // Opening a step is the interaction that would persist on /ai-coach.
    fireEvent.click(screen.getAllByText("Alternate picking")[0]);

    expect(updateRoadmap).not.toHaveBeenCalled();
  });

  it("starts somebody else's roadmap under the viewer's own uid", async () => {
    render(<UserRoadmapsTab enabled section='board' />);
    fireEvent.click(screen.getByText("Plan: shred"));

    fireEvent.click(screen.getByText("Start this roadmap"));

    await vi.waitFor(() =>
      expect(startRoadmap).toHaveBeenCalledWith("viewer-uid", "gen-1"),
    );
    await screen.findByText(/You are working through/);
    expect(screen.queryByText("Start this roadmap")).toBeNull();
  });

  it("treats the viewer's own generated roadmap as writable, with no read-only notice", () => {
    render(<UserRoadmapsTab enabled section='own' />);

    fireEvent.click(screen.getByText("Plan: shred"));

    expect(screen.queryByText(/Somebody else.s roadmap/)).toBeNull();
    expect(screen.queryByText("Start this roadmap")).toBeNull();
  });

  it("keeps the viewer's own name off their own cards and offers to start them", () => {
    render(<UserRoadmapsTab enabled section='own' />);

    expect(screen.queryByText("You")).toBeNull();
    expect(screen.getByText("Start learning")).toBeDefined();
  });

  it("shows nothing of the lists while another tab is up", () => {
    render(<UserRoadmapsTab enabled section='none' />);

    expect(screen.queryByText("Plan: shred")).toBeNull();
  });
});
