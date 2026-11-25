// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTourHref } from "../tour/tourSteps";
import OnboardingView from "./OnboardingView";

const { router, saveOnboarding, saveDailyGoal, dispatch } = vi.hoisted(() => ({
  router: {
    query: {} as Record<string, string>,
    push: vi.fn(),
  },
  saveOnboarding: vi.fn(),
  saveDailyGoal: vi.fn(),
  dispatch: vi.fn(),
}));

vi.mock("next/router", () => ({ useRouter: () => router }));

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

vi.mock("../services/onboarding.service", () => ({
  firebaseSaveOnboarding: saveOnboarding,
}));

vi.mock("feature/settings/services/settings.service", () => ({
  firebaseUpdateDailyGoalMinutes: saveDailyGoal,
}));

vi.mock("feature/user/store/userSlice", () => ({
  setDailyGoalMinutes: (minutes: number) => ({
    type: "user/setDailyGoalMinutes",
    payload: minutes,
  }),
}));

vi.mock("store/hooks", () => ({ useAppDispatch: () => dispatch }));

vi.mock("feature/logs/services/addPlayerJoinedLog.service", () => ({
  addPlayerJoinedLog: vi.fn(),
}));

const heading = (name: string) => screen.findByRole("heading", { name });

/** Level, then daily goal: the two answers before the first minute. */
const answerUpToFirstMinute = async (
  level = "levels.some.label",
  minutes = "30",
) => {
  fireEvent.click(screen.getByText(level));
  await heading("daily_step.title");
  fireEvent.click(screen.getByText(minutes));
  await heading("first_step.title");
};

describe("OnboardingView", () => {
  beforeEach(() => {
    router.query = {};
    router.push.mockReset().mockResolvedValue(true);
    saveOnboarding.mockReset().mockResolvedValue(undefined);
    saveDailyGoal.mockReset().mockResolvedValue(undefined);
    dispatch.mockReset();
  });
  afterEach(cleanup);

  it("asks the level, then the daily goal, then the first minute", async () => {
    render(<OnboardingView />);
    expect(await heading("level_step.title")).toBeTruthy();

    await answerUpToFirstMinute();

    expect(screen.getByText("first_step.riff_title")).toBeTruthy();
    expect(screen.getByText("first_step.hunt_title")).toBeTruthy();
    expect(screen.getByText("first_step.browse")).toBeTruthy();
  });

  it("writes the daily goal to the settings field as soon as it is picked", async () => {
    render(<OnboardingView />);

    await answerUpToFirstMinute("levels.new.label", "60");

    expect(saveDailyGoal).toHaveBeenCalledWith(60);
    expect(dispatch).toHaveBeenCalledWith({
      type: "user/setDailyGoalMinutes",
      payload: 60,
    });
    // The rest of the answers are saved only at the end.
    expect(saveOnboarding).not.toHaveBeenCalled();
  });

  it("sends a player who wants to play to the first riff for their level", async () => {
    router.query = { from: "signup" };
    render(<OnboardingView />);
    await answerUpToFirstMinute("levels.experienced.label", "15");

    fireEvent.click(screen.getByText("first_step.riff_title"));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/onboarding/first-riff?level=experienced&from=signup",
      ),
    );
    expect(saveOnboarding).toHaveBeenCalledWith({
      level: "experienced",
      dailyGoalMinutes: 15,
      playChoice: "play",
    });
  });

  it("sends the fretboard answer to the one-minute hunt", async () => {
    render(<OnboardingView />);
    await answerUpToFirstMinute("levels.new.label", "5");

    fireEvent.click(screen.getByText("first_step.hunt_title"));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/onboarding/first-hunt?level=new&from=direct",
      ),
    );
    expect(saveOnboarding).toHaveBeenCalledWith({
      level: "new",
      dailyGoalMinutes: 5,
      playChoice: "hunt",
    });
  });

  it("takes a player who looks around straight to Home and the tour", async () => {
    render(<OnboardingView />);
    await answerUpToFirstMinute();

    fireEvent.click(screen.getByText("first_step.browse"));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(getTourHref(null)),
    );
  });

  it("goes back one question with the back key", async () => {
    render(<OnboardingView />);
    fireEvent.click(screen.getByText("levels.some.label"));
    await heading("daily_step.title");

    fireEvent.click(screen.getByRole("button", { name: "back" }));

    expect(await heading("level_step.title")).toBeTruthy();
  });

  it("picks answers with the number keys", async () => {
    render(<OnboardingView />);

    fireEvent.keyDown(window, { key: "2" });
    await heading("daily_step.title");
    fireEvent.keyDown(window, { key: "1" });
    await heading("first_step.title");

    expect(saveDailyGoal).toHaveBeenCalledWith(5);
    fireEvent.keyDown(window, { key: "2" });
    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/onboarding/first-hunt?level=some&from=direct",
      ),
    );
  });

  it("skips to Home and the tour", () => {
    render(<OnboardingView />);
    expect(
      screen.getByRole("link", { name: "skip" }).getAttribute("href"),
    ).toBe(getTourHref(null));
  });
});
