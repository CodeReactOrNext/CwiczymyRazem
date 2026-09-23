// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RoadmapJobView } from "feature/supporterPanel/types/roadmapJob.types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
}));

const startRoadmapJob = vi.fn();
const advanceRoadmapJob = vi.fn();
const fetchRoadmapJob = vi.fn();
vi.mock("../services/roadmapJob.service", () => ({
  startRoadmapJob: (...args: unknown[]) => startRoadmapJob(...args),
  advanceRoadmapJob: (...args: unknown[]) => advanceRoadmapJob(...args),
  fetchRoadmapJob: (...args: unknown[]) => fetchRoadmapJob(...args),
}));

const { applyJob, crawlProgress, useGenerateRoadmap } =
  await import("./useGenerateRoadmap");

const job = (overrides: Partial<RoadmapJobView> = {}): RoadmapJobView => ({
  ticketId: "t1",
  roadmapId: "r1",
  goal: "Learn blues",
  level: "Beginner",
  visibility: "public",
  status: "running",
  step: "draft",
  revising: false,
  phasesDone: 0,
  phasesTotal: 0,
  lessonsDone: 0,
  lessonsTotal: 0,
  error: null,
  refunded: false,
  updatedAt: "",
  ...overrides,
});

const idle = {
  status: "idle" as const,
  stageLabel: "",
  stage: null,
  progress: 0,
  bounds: [0, 0] as [number, number],
  since: 0,
  job: null,
  error: null,
};

afterEach(cleanup);

describe("crawlProgress", () => {
  it("starts at the floor and eases towards the ceiling without reaching it", () => {
    expect(crawlProgress(14, 22, 0)).toBe(14);

    const early = crawlProgress(14, 22, 5_000);
    const later = crawlProgress(14, 22, 40_000);

    expect(early).toBeGreaterThan(14);
    expect(later).toBeGreaterThan(early);
    expect(later).toBeLessThan(22);
    expect(crawlProgress(14, 22, 10 * 60_000)).toBeLessThan(22);
  });

  it("never moves when the band has no room, and ignores a negative elapsed time", () => {
    expect(crawlProgress(30, 30, 90_000)).toBe(30);
    expect(crawlProgress(30, 20, 90_000)).toBe(30);
    expect(crawlProgress(14, 22, -5_000)).toBe(14);
  });
});

describe("applyJob", () => {
  it("names each half of the skeleton, the rewrite included", () => {
    const draft = applyJob(idle, job());
    expect(draft.stageLabel).toMatch(/Drafting/);

    const review = applyJob(draft, job({ step: "review" }));
    expect(review.stageLabel).toMatch(/reviewed/);
    expect(review.progress).toBeGreaterThan(draft.progress);

    const revise = applyJob(review, job({ step: "review", revising: true }));
    expect(revise.stageLabel).toMatch(/rewriting/);
  });

  it("counts the phases and lessons and never walks the bar backwards", () => {
    const phases = applyJob(
      idle,
      job({ step: "phases", phasesDone: 3, phasesTotal: 7 }),
    );
    expect(phases.stageLabel).toBe("Writing the phases (3/7)");

    const lessons = applyJob(
      phases,
      job({ step: "lessons", lessonsDone: 10, lessonsTotal: 40 }),
    );
    expect(lessons.stageLabel).toBe("Finding lessons (10/40)");
    expect(lessons.progress).toBeGreaterThanOrEqual(75);

    // A late poll answering with an earlier stage cannot pull the bar back.
    const late = applyJob(
      lessons,
      job({ step: "phases", phasesDone: 3, phasesTotal: 7 }),
    );
    expect(late.progress).toBeGreaterThanOrEqual(lessons.progress);
  });

  it("does not restart the crawl for a repeated report of the same stage", () => {
    const first = applyJob(idle, job({ step: "review" }));
    const again = applyJob(first, job({ step: "review" }));
    expect(again.since).toBe(first.since);
  });

  it("says when a failed generation gave its tokens back", () => {
    const failed = applyJob(
      idle,
      job({ status: "failed", error: "Model down", refunded: true }),
    );
    expect(failed.status).toBe("error");
    expect(failed.error).toBe("Model down Your tokens were given back.");
  });

  it("ignores reports about another ticket", () => {
    const mine = applyJob(idle, job());
    expect(applyJob(mine, job({ ticketId: "t2", step: "save" }))).toBe(mine);
  });
});

// Each test resets the mocks at its top: with vi.mock hoisting, a shared
// beforeEach can hide the implementations a test sets up.
describe("useGenerateRoadmap", () => {
  it("starts idle when no generation is running", async () => {
    fetchRoadmapJob.mockReset().mockResolvedValue(null);
    const { result } = renderHook(() => useGenerateRoadmap());
    await waitFor(() => expect(fetchRoadmapJob).toHaveBeenCalled());
    expect(result.current.status).toBe("idle");
  });

  it("pays, drives the job to the end and hands over the roadmap id once", async () => {
    fetchRoadmapJob.mockReset().mockResolvedValue(null);
    startRoadmapJob.mockReset().mockResolvedValue({
      job: job(),
      charged: true,
      tokensCharged: 10,
      wallet: { left: 0 },
    });
    advanceRoadmapJob
      .mockReset()
      .mockResolvedValue(job({ status: "done", step: "save" }));
    const onDone = vi.fn();

    const { result } = renderHook(() => useGenerateRoadmap({ onDone }));
    await act(async () => {
      await result.current.start("Blues", "Learn blues", "Beginner");
    });

    await waitFor(() => expect(onDone).toHaveBeenCalledWith("r1"));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(advanceRoadmapJob).toHaveBeenCalledWith("t1");
    expect(result.current.status).toBe("done");
  });

  it("picks up a generation that kept running while the panel was closed", async () => {
    fetchRoadmapJob
      .mockReset()
      .mockResolvedValue(
        job({ step: "phases", phasesDone: 2, phasesTotal: 6 }),
      );
    advanceRoadmapJob.mockReset().mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useGenerateRoadmap());

    await waitFor(() => expect(result.current.status).toBe("running"));
    expect(result.current.stageLabel).toBe("Writing the phases (2/6)");
    expect(advanceRoadmapJob).toHaveBeenCalledWith("t1");
  });

  it("lands on error when the charge is refused, and lets you start again", async () => {
    fetchRoadmapJob.mockReset().mockResolvedValue(null);
    startRoadmapJob
      .mockReset()
      .mockRejectedValue(new Error("Not enough tokens left"));

    const { result } = renderHook(() => useGenerateRoadmap());
    await act(async () => {
      await result.current.start("Blues", "Learn blues", "Beginner");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Not enough tokens left");

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
