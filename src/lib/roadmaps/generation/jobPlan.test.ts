import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import {
  APPROVAL_TIMEOUT_MS,
  approved,
  awaitingApproval,
  initialJob,
  isApprovalOverdue,
  isLeaseFree,
  type JobTicket,
  MAX_JOB_ATTEMPTS,
  nextLessonBatch,
  nextPhaseBatch,
  toJobView,
  withDescribedPhases,
  withFailure,
  withFeedback,
  withLessons,
  withSkeleton,
} from "./jobPlan";

const phase = (id: string, stepCount: number): RoadmapPhase => ({
  id,
  title: `Phase ${id}`,
  order: 0,
  steps: Array.from({ length: stepCount }, (_, index) => ({
    id: `${id}-s${index}`,
    title: `Step ${index}`,
    description: "",
    successCriteria: "",
    sessionsRequired: 2,
    sessionsCompleted: 0,
    order: index,
  })),
});

const ticket = (overrides: Partial<JobTicket> = {}): JobTicket => ({
  id: "t1",
  uid: "u1",
  goal: "Blues",
  level: "Beginner",
  roadmapId: "r1",
  visibility: "public",
  draft: null,
  structure: null,
  progress: null,
  ...overrides,
});

const now = new Date("2026-09-23T10:00:00.000Z");

describe("initialJob", () => {
  it("starts at the draft on a fresh ticket", () => {
    expect(initialJob(ticket(), now).step).toBe("draft");
  });

  it("skips what the ticket already paid for", () => {
    expect(initialJob(ticket({ draft: [{}] }), now).step).toBe("review");

    const skeleton = [phase("a", 2), phase("b", 3)];
    const job = initialJob(ticket({ structure: { phases: skeleton } }), now);
    expect(job.step).toBe("phases");
    expect(job.lessonsTotal).toBe(5);
  });
});

describe("phases", () => {
  const skeleton = [phase("a", 1), phase("b", 1), phase("c", 1), phase("d", 1)];
  const job = withSkeleton(initialJob(ticket(), now), skeleton);

  it("hands out the phases in batches, in map order", () => {
    expect(nextPhaseBatch(job, 3)).toEqual([0, 1, 2]);
  });

  it("moves on to the lessons once every phase has its text", () => {
    const written = (id: string) => ({
      ...skeleton.find((p) => p.id === id)!,
      title: `Written ${id}`,
    });
    const partway = withDescribedPhases(job, ["a", "b", "c"].map(written));
    expect(partway.step).toBe("phases");
    expect(nextPhaseBatch(partway, 3)).toEqual([3]);
    expect(partway.phases?.[0].title).toBe("Written a");

    const finished = withDescribedPhases(partway, [written("d")]);
    expect(finished.step).toBe("lessons");
  });
});

describe("lessons", () => {
  const job = {
    ...withSkeleton(initialJob(ticket(), now), [phase("a", 4), phase("b", 3)]),
    step: "lessons" as const,
  };

  it("walks the steps in batches and attaches what was found", () => {
    const batch = nextLessonBatch(job, 5);
    expect(batch.map(({ step }) => step.id)).toEqual([
      "a-s0",
      "a-s1",
      "a-s2",
      "a-s3",
      "b-s0",
    ]);

    const after = withLessons(job, batch.length, { "a-s1": ["yt-1"] });
    expect(after.lessonCursor).toBe(5);
    expect(after.step).toBe("lessons");
    expect(after.phases?.[0].steps[1].suggestedLessonIds).toEqual(["yt-1"]);
    // A step whose search found nothing is left as it was.
    expect(after.phases?.[0].steps[0].suggestedLessonIds).toBeUndefined();

    const done = withLessons(after, 2, {});
    expect(done.step).toBe("save");
  });
});

describe("failures", () => {
  const job = initialJob(ticket(), now);

  it("keeps trying until the last attempt", () => {
    let failing = job;
    for (let attempt = 1; attempt < MAX_JOB_ATTEMPTS; attempt += 1) {
      failing = withFailure(failing, "timeout", false);
      expect(failing.status).toBe("running");
    }
    expect(withFailure(failing, "timeout", false).status).toBe("failed");
  });

  it("gives up at once on a failure a retry cannot fix", () => {
    expect(withFailure(job, "Not a guitar goal", true).status).toBe("failed");
  });
});

describe("leases", () => {
  it("is free when nobody holds it or the holder ran out of time", () => {
    const job = initialJob(ticket(), now);
    expect(isLeaseFree(job, 1000)).toBe(true);
    expect(isLeaseFree({ ...job, leaseUntil: 2000 }, 1000)).toBe(false);
    expect(isLeaseFree({ ...job, leaseUntil: 500 }, 1000)).toBe(true);
  });
});

describe("toJobView", () => {
  it("reports the rewrite only while the review is running", () => {
    const job = { ...initialJob(ticket({ draft: [{}] }), now) };
    const view = toJobView({
      ...ticket({ progress: { stage: "revise" } }),
      job,
    });
    expect(view.step).toBe("review");
    expect(view.revising).toBe(true);
  });
});

describe("the stop for the owner's OK", () => {
  const reviewed = withSkeleton(initialJob(ticket(), now), [
    phase("a", 2),
    phase("b", 1),
  ]);
  const waiting = awaitingApproval(reviewed, now);

  it("shows the plan by its titles and offers one round of changes", () => {
    expect(waiting.status).toBe("awaiting_approval");
    const view = toJobView({ ...ticket(), job: waiting });
    expect(view.skeleton).toEqual([
      { title: "Phase a", steps: ["Step 0", "Step 1"] },
      { title: "Phase b", steps: ["Step 0"] },
    ]);
    expect(view.feedbackLeft).toBe(true);
    // A running job carries no plan: the browser has nothing to ask.
    expect(toJobView({ ...ticket(), job: reviewed }).skeleton).toBeUndefined();
  });

  it("goes on to the descriptions once approved", () => {
    const next = approved(waiting);
    expect(next.status).toBe("running");
    expect(next.step).toBe("phases");
  });

  it("sends the plan back once, and only once, for the owner's note", () => {
    const reshaping = withFeedback(waiting, "  fewer theory steps  ");
    expect(reshaping.status).toBe("running");
    expect(reshaping.step).toBe("reshape");
    expect(reshaping.feedback).toBe("fewer theory steps");

    const again = awaitingApproval(reshaping, now);
    expect(again.feedback).toBeNull();
    expect(toJobView({ ...ticket(), job: again }).feedbackLeft).toBe(false);
  });

  it("is overdue after the timeout, and never while it is running", () => {
    const asked = now.getTime();
    expect(isApprovalOverdue(waiting, asked + APPROVAL_TIMEOUT_MS - 1)).toBe(
      false,
    );
    expect(isApprovalOverdue(waiting, asked + APPROVAL_TIMEOUT_MS + 1)).toBe(
      true,
    );
    expect(isApprovalOverdue(reviewed, asked + APPROVAL_TIMEOUT_MS * 2)).toBe(
      false,
    );
  });
});
