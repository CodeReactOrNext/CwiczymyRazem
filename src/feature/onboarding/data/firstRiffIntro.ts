import type { OnboardingLevel } from "../types";

/**
 * The short walk-through before the first riff: where the tempo is, what the
 * mic does (or that there is none), and that the tab can be set up. One idea
 * per slide, each beside a still of the session with that control lit
 * (view/SessionPreview).
 */
export type IntroSlideId = "tempo" | "mic" | "no_mic" | "tab";

export interface IntroSlide {
  id: IntroSlideId;
  /** The control sits in the session's slide-up panel on a phone, not on screen. */
  inPhonePanel: boolean;
}

const SLIDES: Record<IntroSlideId, IntroSlide> = {
  tempo: { id: "tempo", inPhonePanel: true },
  mic: { id: "mic", inPhonePanel: true },
  no_mic: { id: "no_mic", inPhonePanel: false },
  tab: { id: "tab", inPhonePanel: false },
};

export const getIntroSlides = (withMic: boolean): IntroSlide[] => [
  SLIDES.tempo,
  withMic ? SLIDES.mic : SLIDES.no_mic,
  SLIDES.tab,
];

/**
 * Beginners get what the click and the numbers mean; everyone else only where
 * things are.
 */
export const getIntroVoice = (level: OnboardingLevel): "beginner" | "player" =>
  level === "new" ? "beginner" : "player";
