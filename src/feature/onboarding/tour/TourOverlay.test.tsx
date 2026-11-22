// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TourOverlay from "./TourOverlay";
import { NO_GUITAR_HREF } from "./tourSteps";
import { useTourStore } from "./tourStore";

const { router, saveOutcome } = vi.hoisted(() => ({
  router: { pathname: "/dashboard", push: vi.fn() },
  saveOutcome: vi.fn(),
}));

vi.mock("next/router", () => ({ useRouter: () => router }));
vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("hooks/useMediaQuery", () => ({ useMediaQuery: () => true }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => true }));
vi.mock("components/Mascot/Kostek", () => ({ Kostek: () => null }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("./tour.service", () => ({ firebaseSaveTourOutcome: saveOutcome }));

const startTour = (noGuitar = false) =>
  act(() => {
    useTourStore
      .getState()
      .start(
        { destination: { goal: "journey", href: "/journey" }, noGuitar },
        "onboarding",
      );
  });

describe("TourOverlay", () => {
  beforeEach(() => {
    router.pathname = "/dashboard";
    router.push.mockReset().mockResolvedValue(true);
    saveOutcome.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    act(() => useTourStore.getState().stop());
  });

  it("opens with Kostek's hello and moves on with the main button", () => {
    startTour();
    render(<TourOverlay />);

    expect(screen.getByRole("dialog").textContent).toContain(
      "tour.welcome.title",
    );
    fireEvent.click(screen.getByText("tour.welcome.cta"));

    expect(useTourStore.getState().index).toBe(1);
  });

  it("can be skipped with Escape, and remembers where", () => {
    startTour();
    render(<TourOverlay />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(useTourStore.getState().active).toBe(false);
    expect(saveOutcome).toHaveBeenCalledWith({
      status: "skipped",
      step: "welcome",
    });
  });

  it("ends a player without a guitar on exercises that need none", () => {
    startTour(true);
    router.pathname = "/timer";
    act(() => useTourStore.getState().goTo(99));
    render(<TourOverlay />);

    fireEvent.click(screen.getByText("tour.done.cta_no_guitar"));

    expect(router.push).toHaveBeenCalledWith(NO_GUITAR_HREF);
    expect(saveOutcome).toHaveBeenCalledWith({
      status: "completed",
      step: "done",
    });
    expect(useTourStore.getState().active).toBe(false);
  });

  it("stays out of the way on a page the current step is not on", () => {
    startTour();
    router.pathname = "/songs";
    render(<TourOverlay />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
