import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { toPresenceActivity } from "hooks/usePresence";
import type { CurrentActivityInterface } from "types/api.types";
import { describe, expect, it } from "vitest";

import { resolveLiveActivity } from "./liveActivity";

const [first, second] = exercisesAgregat;
const catalogPlan = defaultPlans.find((plan) => plan.exercises.length > 1)!;

const activity = (
  overrides: Partial<CurrentActivityInterface> = {},
): CurrentActivityInterface => ({
  planTitle: "Shred Hour",
  exerciseTitle: first.title,
  timestamp: 0,
  ...overrides,
});

describe("resolveLiveActivity", () => {
  it("opens the exercise being played, by id", () => {
    const { current } = resolveLiveActivity(
      activity({ exerciseId: second.id, exerciseTitle: "Renamed since" }),
    );

    expect(current).toEqual({
      preview: { kind: "exercise", exercise: second },
    });
  });

  it("falls back to the title for players on an older build", () => {
    const { current } = resolveLiveActivity(activity());

    expect(current).toEqual({ preview: { kind: "exercise", exercise: first } });
  });

  it("opens a lesson as a lesson, whatever its title", () => {
    const { current, plan } = resolveLiveActivity(
      activity({
        planTitle: "AI Coach lesson",
        exerciseTitle: "Sweep Picking 101",
        lessonVideoId: "dQw4w9WgXcQ",
      }),
    );

    expect(current).toEqual({
      preview: {
        kind: "lesson",
        title: "Sweep Picking 101",
        videoId: "dQw4w9WgXcQ",
      },
    });
    expect(plan).toBeNull();
  });

  it("links a song session to the song", () => {
    const { current } = resolveLiveActivity(
      activity({ exerciseTitle: "Metallica - One", songId: "song-1" }),
    );

    expect(current).toEqual({
      href: "/songs?view=management&songId=song-1",
    });
  });

  it("names nothing it can't open", () => {
    expect(
      resolveLiveActivity(activity({ exerciseTitle: "My own riff" })),
    ).toEqual({ current: null, plan: null });
  });

  it("opens a catalog plan as that plan", () => {
    const { plan } = resolveLiveActivity(activity({ planId: catalogPlan.id }));

    expect(plan).toEqual({ kind: "plan", plan: catalogPlan });
  });

  it("opens someone's own routine through its exercises", () => {
    const { plan } = resolveLiveActivity(
      activity({
        planId: "user-plan-id",
        exerciseIds: [first.id, "custom-exercise", second.id],
      }),
    );

    expect(plan).toEqual({
      kind: "routine",
      title: "Shred Hour",
      exercises: [first, second],
    });
  });

  it("leaves a single-exercise session's plan line alone", () => {
    const { plan } = resolveLiveActivity(
      activity({ planId: `exercise-${first.id}`, exerciseIds: [first.id] }),
    );

    expect(plan).toBeNull();
  });
});

describe("toPresenceActivity", () => {
  it("drops the fields that came out undefined", () => {
    const published = toPresenceActivity(
      activity({ exerciseId: undefined, songId: undefined, planId: "p" }),
    );

    expect(published).toEqual({
      planTitle: "Shred Hour",
      exerciseTitle: first.title,
      timestamp: 0,
      planId: "p",
    });
    expect(Object.values(published!)).not.toContain(undefined);
  });

  it("keeps a cleared activity cleared", () => {
    expect(toPresenceActivity(null)).toBeNull();
  });
});
