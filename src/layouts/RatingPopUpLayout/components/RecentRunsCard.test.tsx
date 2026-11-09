// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ExerciseRun } from "feature/exerciseGoals/types/exerciseGoal.types";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecentRunsCard, soleExerciseWithTempo } from "./RecentRunsCard";

const runsByExercise: Record<string, ExerciseRun[]> = {};

vi.mock("feature/exerciseGoals/services/exerciseGoals.service", () => ({
  getExerciseRuns: (_uid: string, exerciseId: string) =>
    Promise.resolve(runsByExercise[exerciseId] ?? []),
}));
vi.mock("feature/exerciseGoals/components/GoalRunsChart", () => ({
  GoalRunsChart: ({ runs }: { runs: ExerciseRun[] }) => (
    <div data-testid='chart'>{runs.length}</div>
  ),
}));
vi.mock("store/hooks", () => ({ useAppSelector: () => "uid-1" }));
vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key} ${JSON.stringify(vars)}` : key,
  }),
}));

const scored = (exerciseId: string, bpm?: number): ScoredRun => ({
  exerciseId,
  exerciseTitle: `Title ${exerciseId}`,
  score: 100,
  scoreType: "mic",
  previousBest: 0,
  bpm,
});

const history = (exerciseId: string, bpms: number[]): ExerciseRun[] =>
  bpms.map((bpm, i) => ({
    id: `${exerciseId}-${i}`,
    exerciseId,
    bpm,
    accuracy: 90,
    source: "practice",
    goalId: null,
    clean: null,
    createdAt: i,
    timingOffsetMs: null,
    timingBiasMs: null,
  }));

const renderCard = (runs: ScoredRun[]) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }>
      <RecentRunsCard runs={runs} />
    </QueryClientProvider>,
  );

describe("soleExerciseWithTempo", () => {
  it("picks the session's only exercise, scored again or not", () => {
    expect(soleExerciseWithTempo([scored("a", 80)])?.exerciseId).toBe("a");
    expect(soleExerciseWithTempo([scored("a", 80), scored("a", 90)])?.bpm).toBe(
      80,
    );
  });

  it("picks nothing for a session of several exercises or without a tempo", () => {
    expect(
      soleExerciseWithTempo([scored("a", 80), scored("b", 60)]),
    ).toBeNull();
    expect(soleExerciseWithTempo([scored("a")])).toBeNull();
    expect(soleExerciseWithTempo([])).toBeNull();
  });
});

describe("RecentRunsCard", () => {
  afterEach(() => {
    cleanup();
    for (const key of Object.keys(runsByExercise)) delete runsByExercise[key];
  });

  it("charts the exercise once it has more than two runs", async () => {
    runsByExercise.a = history("a", [80, 85, 95]);

    renderCard([scored("a", 95)]);

    expect(await screen.findByTestId("chart")).toBeTruthy();
    expect(screen.getByText("recent_runs.title")).toBeTruthy();
    expect(screen.getByText(/"from":80,"to":95/)).toBeTruthy();
  });

  it("shows nothing while the exercise has two runs or fewer", async () => {
    runsByExercise.a = history("a", [80, 85]);

    const { container } = renderCard([scored("a", 85)]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.innerHTML).toBe("");
  });

  it("shows nothing after a session of several exercises", async () => {
    runsByExercise.a = history("a", [80, 85, 90, 100]);
    runsByExercise.b = history("b", [60, 65, 70]);

    const { container } = renderCard([scored("a", 100), scored("b", 70)]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.innerHTML).toBe("");
  });
});
