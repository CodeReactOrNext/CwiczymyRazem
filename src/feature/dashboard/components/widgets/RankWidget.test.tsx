// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { DashboardDataContextValue } from "feature/dashboard/context/DashboardContext";
import { DashboardDataProvider } from "feature/dashboard/context/DashboardContext";
import type { StatisticsDataInterface } from "types/api.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RankWidget } from "./RankWidget";

const rank = vi.fn();

vi.mock("feature/leadboard/hooks/useUserRank", () => ({
  useUserRank: (view: string, seasonId?: string) => rank(view, seasonId),
}));

vi.mock("feature/leadboard/services/getCurrentSeason", () => ({
  getCurrentSeasonId: () => "2026-09",
}));

const ranks = (allTime: number | null, seasonal: number | null) => {
  rank.mockImplementation((view: string) =>
    view === "seasonal"
      ? { userRank: seasonal, isLoading: false }
      : { userRank: allTime, isLoading: false },
  );
};

const renderWidget = () => {
  const value = {
    userAuth: "uid-1",
    userStats: { points: 1234, lvl: 7 } as StatisticsDataInterface,
    activity: {
      year: 2026,
      setYear: vi.fn(),
      datasWithReports: [],
      isLoading: false,
      reportList: [],
    },
    totalTimeValue: "10:00",
    timeTrendData: [],
  } as unknown as DashboardDataContextValue;

  return render(
    <DashboardDataProvider value={value}>
      <RankWidget />
    </DashboardDataProvider>,
  );
};

describe("RankWidget", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("shows the all-time and the seasonal standing side by side", () => {
    ranks(42, 5);
    renderWidget();

    expect(screen.getByText("#42")).toBeTruthy();
    expect(screen.getByText("#5")).toBeTruthy();
    expect(screen.getByText("All time")).toBeTruthy();
  });

  it("asks the season board for the month that is running now", () => {
    ranks(42, 5);
    renderWidget();

    expect(rank).toHaveBeenCalledWith("seasonal", "2026-09");
    expect(rank).toHaveBeenCalledWith("all-time", undefined);
    expect(screen.getByText("September")).toBeTruthy();
  });

  it("says a board is still empty rather than showing a rank of nothing", () => {
    ranks(42, null);
    renderWidget();

    expect(screen.getByText("#42")).toBeTruthy();
    expect(screen.getByText("No points this season yet.")).toBeTruthy();
  });

  it("carries the points and level under both standings", () => {
    ranks(42, 5);
    renderWidget();

    expect(screen.getByText("1,234")).toBeTruthy();
    expect(screen.getByText(/level 7/)).toBeTruthy();
  });

  it("shows a skeleton for whichever board is still loading", () => {
    rank.mockImplementation((view: string) =>
      view === "seasonal"
        ? { userRank: null, isLoading: true }
        : { userRank: 42, isLoading: false },
    );
    const { container } = renderWidget();

    expect(screen.getByText("#42")).toBeTruthy();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(1);
  });
});
