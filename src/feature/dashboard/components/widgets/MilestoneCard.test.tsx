// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LEVELS } from "feature/aiSummary/utils/milestoneLogic";
import { milestoneWidgetId } from "feature/dashboard/data/milestoneWidgets";
import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import { milestoneWeekDays } from "feature/dashboard/utils/milestoneWeek";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MilestoneCard } from "./MilestoneCard";

const WEEK = "2026-W37";
const TIER = LEVELS[1]; // Groove — a paid tier, so owned and unowned both mean something.

const mutate = vi.fn();
const progress = vi.fn();

vi.mock("feature/dashboard/hooks/useMilestoneProgress", () => ({
  useMilestoneProgress: () => progress(),
}));

vi.mock("feature/dashboard/hooks/useClaimMilestone", () => ({
  useClaimMilestone: () => ({ mutate, isPending: false }),
}));

const status = (overrides: Partial<MilestoneStatus> = {}): MilestoneStatus => ({
  id: TIER.id,
  name: TIER.name,
  short: TIER.short ?? TIER.name.split(" ")[0],
  req: TIER.req,
  color: "#fbbf24",
  Icon: TIER.Icon,
  reward: TIER.reward,
  cost: TIER.cost,
  met: false,
  owned: true,
  claimed: false,
  lockedAtLvl: null,
  progress: { value: 1, max: 3 },
  ...overrides,
});

const showing = (entry: MilestoneStatus) => {
  progress.mockReturnValue({
    statuses: [entry],
    weekKey: WEEK,
    isLoading: false,
    isError: false,
  });
};

const renderCard = () =>
  render(<MilestoneCard widgetId={milestoneWidgetId(TIER.id)} />);

describe("MilestoneCard", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("puts the goal, the week's count and what it pays on one line", () => {
    showing(status());
    const { container } = renderCard();

    expect(screen.getByText(TIER.name)).toBeTruthy();
    expect(screen.getByText(TIER.req)).toBeTruthy();
    expect(screen.getByText("1/3")).toBeTruthy();
    expect(screen.getByText(`+${TIER.reward} Fame`)).toBeTruthy();
    // The ring on the disc carries the progress, so there is no separate bar.
    expect(container.querySelector("svg circle")).not.toBeNull();
  });

  it("offers the claim once the goal is met on an owned tier, and pays the right week", () => {
    showing(status({ met: true, progress: { value: 3, max: 3 } }));
    renderCard();

    fireEvent.click(
      screen.getByRole("button", { name: `Claim +${TIER.reward}` }),
    );

    expect(mutate).toHaveBeenCalledWith({
      id: TIER.id,
      name: TIER.name,
      reward: TIER.reward,
      weekKey: WEEK,
    });
  });

  it("offers the shop, not a claim, on a tier that is met but never bought", () => {
    showing(status({ met: true, owned: false }));
    renderCard();

    expect(screen.queryByRole("button")).toBeNull();
    const link = screen.getByRole("link", { name: /Unlock/ });
    expect(link.getAttribute("href")).toBe("/summary");
    expect(link.textContent).toContain(`${TIER.cost} Fame`);
  });

  it("says the reward is already collected instead of offering it twice", () => {
    showing(status({ met: true, claimed: true }));
    renderCard();

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Claimed")).toBeTruthy();
  });

  it("shows the level gate and drops the week's count while the tier is out of reach", () => {
    showing(status({ lockedAtLvl: 7, owned: false }));
    renderCard();

    expect(screen.getByText("Opens at level 7")).toBeTruthy();
    expect(screen.queryByText("1/3")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a skeleton rather than a wrong number while the week loads", () => {
    progress.mockReturnValue({
      statuses: null,
      weekKey: WEEK,
      isLoading: true,
      isError: false,
    });
    const { container } = renderCard();

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(TIER.req)).toBeNull();
  });

  it("says the week could not be loaded instead of a skeleton that never ends", () => {
    progress.mockReturnValue({
      statuses: null,
      weekKey: WEEK,
      isLoading: false,
      isError: true,
    });
    const { container } = renderCard();

    expect(screen.getByText(TIER.name)).toBeTruthy();
    expect(screen.getByText(/Couldn't load/)).toBeTruthy();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });
});

describe("the week under a milestone", () => {
  const days = milestoneWeekDays([], new Date(2026, 8, 9));

  const cardFor = (name: string) => {
    const tier = LEVELS.find((entry) => entry.name === name)!;
    progress.mockReturnValue({
      statuses: [status({ id: tier.id, name: tier.name, req: tier.req })],
      days,
      weekKey: WEEK,
      isLoading: false,
      isError: false,
    });
    return render(<MilestoneCard widgetId={milestoneWidgetId(tier.id)} />);
  };

  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("draws a minutes goal as bars under a goal line", () => {
    const { container } = cardFor("Spark");

    expect(container.querySelector(".border-dashed")).not.toBeNull();
    expect(screen.queryByText("Ear")).toBeNull();
  });

  it("drops the goal line on a streak goal, where the run is the point", () => {
    const { container } = cardFor("Hot Streak");

    expect(container.querySelector(".border-dashed")).toBeNull();
    expect(screen.queryByText("Ear")).toBeNull();
  });

  it("names the four categories on an all-round goal", () => {
    // The bug this guards: nine different promises all drawn as one stack of
    // minutes, so a goal about covering four categories never showed them.
    const { container } = cardFor("All-Rounder");

    expect(screen.getByText("Ear")).toBeTruthy();
    expect(screen.getByText("Creativity")).toBeTruthy();
    expect(container.querySelector(".border-dashed")).toBeNull();
  });

  it("keeps the categories on the all-round streaks too", () => {
    cardFor("Virtuoso");

    expect(screen.getByText("Tech")).toBeTruthy();
  });
});
