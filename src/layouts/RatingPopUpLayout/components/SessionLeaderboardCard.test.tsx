// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { getExerciseRankNeighbors } from "feature/leadboard/services/getExerciseRankNeighbors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SessionLeaderboardCard } from "./SessionLeaderboardCard";

vi.mock("feature/leadboard/services/getExerciseRankNeighbors", () => ({
  getExerciseRankNeighbors: vi.fn(),
}));

// The selectors are only used as keys into the mocked store below.
vi.mock("feature/user/store/userSlice", () => ({
  selectUserAuth: "auth",
  selectUserName: "name",
  selectUserAvatar: "avatar",
}));

vi.mock("store/hooks", () => ({
  useAppSelector: (selector: string) =>
    ({ auth: "me", name: "Michal", avatar: "me.png" })[selector],
}));

// Renders no text of its own — names must be asserted against the real rows.
vi.mock("components/UI/Avatar/Avatar", () => ({
  default: ({ name }: { name: string }) => <span data-testid='avatar' aria-label={name} />,
}));

const run: ScoredRun = {
  exerciseId: "spider",
  exerciseTitle: "Spider — Diagonal X",
  score: 21_375,
  scoreType: "mic",
  previousBest: 19_375,
};

// Thousands separators follow the runtime locale, and Testing Library folds the
// non-breaking ones into plain spaces — build expectations the same way.
const num = (value: number) => value.toLocaleString().replace(/\s/g, " ");

const neighbor = (userId: string, score: number, rank: number) => ({
  userId, displayName: userId, avatar: `${userId}.png`, score, rank,
});

const renderCard = (runs: ScoredRun[] = [run]) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SessionLeaderboardCard runs={runs} />
    </QueryClientProvider>
  );

describe("SessionLeaderboardCard", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("names who stands above and below, with their scores", async () => {
    vi.mocked(getExerciseRankNeighbors).mockResolvedValue({
      rank: 3,
      above: [neighbor("piotr", 44_000, 1), neighbor("kasia", 31_490, 2)],
      below: [neighbor("bartek", 18_002, 4)],
    });

    renderCard();

    await waitFor(() => expect(screen.getByText("kasia")).toBeDefined());
    expect(screen.getByText("piotr")).toBeDefined();
    expect(screen.getByText("bartek")).toBeDefined();
    expect(screen.getByText(num(31_490))).toBeDefined();
    expect(screen.getByText("You")).toBeDefined();
    expect(screen.getByText(num(21_375))).toBeDefined();
  });

  it("measures the run against the record it beat", async () => {
    vi.mocked(getExerciseRankNeighbors).mockResolvedValue({
      rank: 3, above: [], below: [],
    });

    renderCard();

    await waitFor(() => expect(screen.getByText(`+${num(2000)} vs your best`)).toBeDefined());
  });

  it("keeps the standing on the record when the run came in under it", async () => {
    vi.mocked(getExerciseRankNeighbors).mockResolvedValue({
      rank: 3, above: [], below: [],
    });

    renderCard([{ ...run, score: 12_000, previousBest: 21_375 }]);

    // The board still shows the record; the weaker run is named underneath it.
    await waitFor(() => expect(screen.getByText(num(21_375))).toBeDefined());
    expect(screen.getByText(`this run ${num(12_000)}`)).toBeDefined();
    expect(screen.getByText(`${num(-9375)} vs your best`)).toBeDefined();
  });

  it("renders nothing when no leaderboard could be read", async () => {
    vi.mocked(getExerciseRankNeighbors).mockResolvedValue(null);

    const { container } = renderCard();

    await waitFor(() => expect(container.innerHTML).toBe(""));
  });
});
