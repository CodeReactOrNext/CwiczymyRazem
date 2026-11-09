// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getIntroSlides } from "../data/firstRiffIntro";
import { FirstRiffIntro } from "./FirstRiffIntro";

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const renderIntro = (
  props: Partial<Parameters<typeof FirstRiffIntro>[0]> = {},
) => {
  const onStart = vi.fn();
  render(
    <FirstRiffIntro
      level='new'
      bpm={60}
      tablature={[]}
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
