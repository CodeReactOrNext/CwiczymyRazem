// @vitest-environment jsdom

import { existsSync } from "node:fs";
import { join } from "node:path";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getIntroScreen, getIntroSlides } from "../data/firstRiffIntro";
import { FirstRiffIntro } from "./FirstRiffIntro";

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

// jsdom has no viewport: the phone reads as held sideways.
vi.mock("hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));

const renderIntro = (
  props: Partial<Parameters<typeof FirstRiffIntro>[0]> = {},
) => {
  const onStart = vi.fn();
  render(
    <FirstRiffIntro
      level='new'
      bpm={60}
      isMobile={false}
      source='signup'
      onStart={onStart}
      {...props}
    />,
  );
  return onStart;
};

const next = () => fireEvent.click(screen.getByText("first_riff_intro.next"));

describe("FirstRiffIntro", () => {
  afterEach(cleanup);

  it("asks about the mic, walks a beginner through three slides and starts with it", () => {
    const onStart = renderIntro();

    fireEvent.click(screen.getByText("first_riff_intro.mic_question.yes"));
    expect(
      screen.getByText("first_riff_intro.slides.tempo.beginner.title"),
    ).toBeTruthy();
    next();
    expect(
      screen.getByText("first_riff_intro.slides.mic.beginner.title"),
    ).toBeTruthy();
    next();
    expect(
      screen.getByText("first_riff_intro.slides.tab.beginner.title"),
    ).toBeTruthy();

    fireEvent.click(screen.getByText("first_riff_intro.start"));
    expect(onStart).toHaveBeenCalledWith(true);
  });

  it("tells a player without a mic they will just play along", () => {
    const onStart = renderIntro({ level: "some" });

    fireEvent.click(screen.getByText("first_riff_intro.mic_question.no"));
    expect(
      screen.getByText("first_riff_intro.slides.tempo.player.title"),
    ).toBeTruthy();
    next();
    expect(
      screen.getByText("first_riff_intro.slides.no_mic.player.title"),
    ).toBeTruthy();

    fireEvent.click(screen.getByText("first_riff_intro.skip"));
    expect(onStart).toHaveBeenCalledWith(false);
  });

  it("says where the tempo lives on a phone", () => {
    renderIntro({ isMobile: true });

    fireEvent.click(screen.getByText("first_riff_intro.mic_question.yes"));
    expect(screen.getByText("first_riff_intro.phone_panel")).toBeTruthy();
  });
});

describe("getIntroScreen", () => {
  it("has a screenshot for every level, device and slide", () => {
    const levels = ["new", "some", "experienced"] as const;
    const devices = ["desktop", "landscape", "portrait"] as const;
    const slides = ["question", "tempo", "mic", "no_mic", "tab"] as const;
    for (const level of levels) {
      for (const device of devices) {
        for (const slide of slides) {
          const { src } = getIntroScreen(level, device, slide);
          expect(existsSync(join(process.cwd(), "public", src)), src).toBe(
            true,
          );
        }
      }
    }
  });

  it("shows each device its own screenshot", () => {
    const sources = (["desktop", "landscape", "portrait"] as const).map(
      (device) => getIntroScreen("new", device, "tempo").src,
    );
    expect(new Set(sources).size).toBe(3);
  });
});

describe("getIntroSlides", () => {
  it("swaps the mic slide for the play-along one without a mic", () => {
    expect(getIntroSlides(true).map((s) => s.id)).toEqual([
      "tempo",
      "mic",
      "tab",
    ]);
    expect(getIntroSlides(false).map((s) => s.id)).toEqual([
      "tempo",
      "no_mic",
      "tab",
    ]);
  });
});
