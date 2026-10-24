// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OnboardingView from "./OnboardingView";

const { router, viewport, saveOnboarding } = vi.hoisted(() => ({
  router: { query: {}, push: vi.fn(), prefetch: vi.fn() },
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

// The journey answer never reaches the plan step, so its cards stay out.
vi.mock("feature/exercisePlan/components/PlanCard", () => ({
  PlanCard: () => null,
}));

const answerAsBeginnerOnTheJourney = async () => {
  fireEvent.click(screen.getByText("levels.new.label"));
  fireEvent.click(await screen.findByText("goals.journey.label"));
};

describe("OnboardingView", () => {
  beforeEach(() => {
    router.push.mockReset().mockResolvedValue(true);
    router.prefetch.mockReset().mockResolvedValue(undefined);
    saveOnboarding.mockReset().mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it("stops a phone player on the desktop step before sending them on", async () => {
    viewport.isMobile = true;
    render(<OnboardingView />);

    await answerAsBeginnerOnTheJourney();

    expect(await screen.findByText("desktop_hint.title")).toBeTruthy();
    expect(saveOnboarding).toHaveBeenCalledWith({
      level: "new",
      goal: "journey",
    });
    expect(router.push).not.toHaveBeenCalled();
    // Nothing is left to skip once the answers are saved.
    expect(screen.queryByText("skip")).toBeNull();

    fireEvent.click(screen.getByText("desktop_hint.continue"));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/journey"));
  });

  it("explains songs before committing a player to them", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    fireEvent.click(screen.getByText("levels.new.label"));
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
    expect(saveOnboarding).toHaveBeenCalledWith({ level: "new", goal: "songs" });
  });

  it("sends a desktop player straight to their answer", async () => {
    viewport.isMobile = false;
    render(<OnboardingView />);

    await answerAsBeginnerOnTheJourney();

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/journey"));
    expect(screen.queryByText("desktop_hint.title")).toBeNull();
  });
});
