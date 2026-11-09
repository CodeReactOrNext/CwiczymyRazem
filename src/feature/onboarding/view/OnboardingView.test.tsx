// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OnboardingView from "./OnboardingView";

const { router, viewport, saveOnboarding } = vi.hoisted(() => ({
  router: {
    query: {} as Record<string, string>,
    push: vi.fn(),
    prefetch: vi.fn(),
  },
  viewport: { isMobile: false },
  saveOnboarding: vi.fn(),
}));

vi.mock("next/router", () => ({ useRouter: () => router }));

vi.mock("store/useResponsiveStore", () => ({
  useResponsiveStore: (select: (state: { isMobile: boolean }) => unknown) =>
    select(viewport),
}));

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

vi.mock("../services/onboarding.service", () => ({
  firebaseSaveOnboarding: saveOnboarding,
}));

vi.mock("feature/logs/services/addPlayerJoinedLog.service", () => ({
  addPlayerJoinedLog: vi.fn(),
}));

// None of these tests reaches the plan picker, so its cards stay out.
vi.mock("feature/exercisePlan/components/PlanCard", () => ({
  PlanCard: () => null,
}));

const lookAroundAsBeginner = async () => {
  fireEvent.click(screen.getByText("levels.new.label"));
  fireEvent.click(await screen.findByText("play_step.options.browse"));
};

describe("OnboardingView", () => {
  beforeEach(() => {
    router.query = {};
    router.push.mockReset().mockResolvedValue(true);
    router.prefetch.mockReset().mockResolvedValue(undefined);
    saveOnboarding.mockReset().mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it("asks about the guitar right after the level", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    fireEvent.click(screen.getByText("levels.some.label"));

    expect(await screen.findByText("play_step.title")).toBeTruthy();
    expect(screen.getByText("play_step.start")).toBeTruthy();
    expect(screen.getByText("play_step.options.no_guitar")).toBeTruthy();
  });

  it("sends a player who wants to play to the first riff for their level", async () => {
    viewport.isMobile = true;
    router.query = { from: "signup" };
    render(<OnboardingView />);

    fireEvent.click(screen.getByText("levels.experienced.label"));
    fireEvent.click(await screen.findByText("play_step.start"));

    expect(router.push).toHaveBeenCalledWith(
      "/onboarding/first-riff?level=experienced&from=signup",
    );
    // The goal is asked after the riff, so nothing is saved yet.
    expect(saveOnboarding).not.toHaveBeenCalled();
  });

  it("comes back from the first riff on the goal question, without the desktop step", async () => {
    viewport.isMobile = true;
    router.query = { step: "goal", level: "some", played: "1", from: "signup" };
    render(<OnboardingView />);

    expect(screen.getByText("goal_step.title_after_play")).toBeTruthy();

    fireEvent.click(screen.getByText("goals.songs.label"));
    fireEvent.click(await screen.findByText("songs_step.continue"));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/songs?view=management"),
    );
    expect(saveOnboarding).toHaveBeenCalledWith({
      level: "some",
      goal: "songs",
      playChoice: "play",
    });
    expect(screen.queryByText("desktop_hint.title")).toBeNull();
  });

  it("shows a player looking around the plan library, not a plan session", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    await lookAroundAsBeginner();
    fireEvent.click(await screen.findByText("goals.plans.label"));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/timer/plans"),
    );
    expect(screen.queryByText("plan_step.title")).toBeNull();
    expect(saveOnboarding).toHaveBeenCalledWith({
      level: "new",
      goal: "plans",
      playChoice: "browse",
    });
  });

  it("stops a phone player looking around on the desktop step", async () => {
    viewport.isMobile = true;
    render(<OnboardingView />);

    await lookAroundAsBeginner();
    fireEvent.click(await screen.findByText("goals.journey.label"));

    expect(await screen.findByText("desktop_hint.title")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
    // Nothing is left to skip once the answers are saved.
    expect(screen.queryByText("skip")).toBeNull();

    fireEvent.click(screen.getByText("desktop_hint.continue"));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/journey"));
  });

  it("tells a player without a guitar what they can already look at", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    fireEvent.click(screen.getByText("levels.new.label"));
    fireEvent.click(
      await screen.findByText("play_step.options.no_guitar"),
    );

    expect(await screen.findByText("goal_step.title_no_guitar")).toBeTruthy();
    expect(screen.getByText("goal_step.no_guitar_hint")).toBeTruthy();
  });

  it("explains songs before committing a player to them", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    await lookAroundAsBeginner();
    fireEvent.click(await screen.findByText("goals.songs.label"));

    expect(await screen.findByText("songs_step.no_tabs")).toBeTruthy();
    expect(saveOnboarding).not.toHaveBeenCalled();

    // No tabs can be a dealbreaker: the way back leads to the other answers.
    fireEvent.click(screen.getByText("songs_step.other"));
    fireEvent.click(await screen.findByText("goals.songs.label"));

    fireEvent.click(await screen.findByText("songs_step.continue"));
    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/songs?view=management"),
    );
  });

  it("sends a desktop player straight to their answer", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    await lookAroundAsBeginner();
    fireEvent.click(await screen.findByText("goals.journey.label"));

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/journey"));
    expect(screen.queryByText("desktop_hint.title")).toBeNull();
  });
});
