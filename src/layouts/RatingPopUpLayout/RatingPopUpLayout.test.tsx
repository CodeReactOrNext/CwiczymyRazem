// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import { saveReportNote } from "feature/practiceLog/services/practiceLogMutations.service";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import RatingPopUpLayout from "./RatingPopUpLayout";

const { claimLevels } = vi.hoisted(() => ({ claimLevels: vi.fn(() => null) }));

vi.mock("hooks/useRewardLedger", () => ({ useAutoClaimLevels: claimLevels }));
vi.mock("feature/progression/components/NextUpCard", () => ({
  NextReward: () => <p>the next reward</p>,
  PaidLevels: () => null,
  useHasNextReward: () => true,
}));
vi.mock("feature/practiceLog/services/practiceLogMutations.service", () => ({
  saveReportNote: vi.fn(() => Promise.resolve()),
}));
vi.mock("./components/SessionCelebration", () => ({ SessionCelebration: () => <p>celebration</p> }));
vi.mock("./components/SessionLeaderboardCard", () => ({ SessionLeaderboardCard: () => <p>standings</p> }));
vi.mock("./components/RecentRunsCard", () => ({ RecentRunsCard: () => <p>chart</p> }));
vi.mock("lib/uiSounds/uiSounds", () => ({ playUiSound: vi.fn() }));

const REPORT: ReportDataInterface = {
  reportDate: new Date("2026-11-24T10:00:00Z"),
  totalPoints: 86,
  fameEarned: 42,
  bonusPoints: { multiplier: 0.2, habitsCount: 0, additionalPoints: 0, time: 28 * 60_000, timePoints: 72 },
  skillPointsGained: { technique: 3 },
};
const before = { ...statisticsInitial, lvl: 12, points: 1000, actualDayWithoutBreak: 4 };
const after = { ...before, points: 1086 };
const run = { exerciseId: "spider", exerciseTitle: "Spider", score: 10, scoreType: "mic" as const, previousBest: 5 };

const show = (props: Partial<React.ComponentProps<typeof RatingPopUpLayout>> = {}) =>
  render(
    <RatingPopUpLayout
      ratingData={REPORT}
      currentUserStats={after}
      previousUserStats={before}
      hideWrapper
      {...props}
    />
  );
const key = (name: string) => screen.findByRole("button", { name });

describe("RatingPopUpLayout", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("walks a scored session through its result, the exercise with its chart, and what comes next", async () => {
    const onClick = vi.fn();
    show({ scoredRuns: [run], onClick });
    expect(screen.getByText("Great progress!")).toBeTruthy();

    fireEvent.click(await key("Continue"));
    expect(await screen.findByText("standings")).toBeTruthy();
    expect(screen.getByText("chart")).toBeTruthy();

    fireEvent.click(await key("Continue"));
    expect(await screen.findByText("the next reward")).toBeTruthy();
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(await key("Done"));
    await waitFor(() => expect(onClick).toHaveBeenCalledWith(false));
    expect(saveReportNote).not.toHaveBeenCalled();
  });

  it("takes a session with no scored exercise straight to what comes next", async () => {
    show();
    fireEvent.click(await key("Continue"));
    expect(await screen.findByText("the next reward")).toBeTruthy();
    expect(await key("Done")).toBeTruthy();
  });

  it("shows where the numbers came from under them, with no key to press", () => {
    show();
    expect(screen.getByText("Great progress!")).toBeTruthy();
    expect(screen.getByText("Skills")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Details" })).toBeNull();
  });

  it("saves a note nobody pressed Save on before leaving", async () => {
    const onClick = vi.fn();
    show({ onClick });
    fireEvent.click(await key("Continue"));
    fireEvent.change(await screen.findByRole("textbox"), { target: { value: "slow the bridge down" } });
    fireEvent.click(await key("Done"));
    await waitFor(() => expect(onClick).toHaveBeenCalled());
    expect(saveReportNote).toHaveBeenCalledWith(REPORT.reportDate.toISOString(), "slow the bridge down");
  });

  it("stays when the note could not be saved", async () => {
    vi.mocked(saveReportNote).mockRejectedValueOnce(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onClick = vi.fn();
    show({ onClick });
    fireEvent.click(await key("Continue"));
    fireEvent.change(await screen.findByRole("textbox"), { target: { value: "note" } });
    fireEvent.click(await key("Done"));
    await waitFor(() => expect(saveReportNote).toHaveBeenCalled());
    await key("Done");
    expect(onClick).not.toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });

  it("pays owed levels as it opens, not on its last step", () => {
    show();
    expect(claimLevels).toHaveBeenCalled();
  });

  it("opens on the celebration, but not after a failed exam", () => {
    show();
    expect(screen.getByText("celebration")).toBeTruthy();
    cleanup();
    show({ examPassed: false });
    expect(screen.queryByText("celebration")).toBeNull();
  });
});
