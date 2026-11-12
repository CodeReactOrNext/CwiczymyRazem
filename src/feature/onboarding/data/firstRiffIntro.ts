import type { OnboardingLevel } from "../types";

/**
 * The short walk-through before the first riff: where the tempo is, what the
 * mic does (or that there is none), and that the tab can be set up. One idea
 * per slide, each beside a screenshot of the session with that control ringed
 * (getIntroScreen).
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

/**
 * Where the walk-through is being read: the session looks different on each,
 * so each has its own screenshots. A phone held upright lays the session on
 * its side; those screenshots are turned back so they read the right way up.
 */
export type IntroDevice = "desktop" | "landscape" | "portrait";

/**
 * The files' pixel sizes, as scripts/buildFirstRiffIntroScreens.mjs cuts them
 * (crop × the capture's pixel ratio, the upright phone's turned a quarter). They are cut from the capture without
 * resampling; rebuild them with that script when the session's look changes.
 */
export const INTRO_SCREEN_SIZE: Record<
  IntroDevice,
  { width: number; height: number }
> = {
  desktop: { width: 1440, height: 960 },
  landscape: { width: 1332, height: 930 },
  portrait: { width: 1332, height: 1170 },
};

/**
 * The level's own riff at its own tempo, on the reader's device, with the
 * slide's control ringed. The mic question shows the mic key while it is off.
 */
export const getIntroScreen = (
  level: OnboardingLevel,
  device: IntroDevice,
  slide: IntroSlideId | "question",
) => ({
  src: `/images/onboarding/first-riff/${level}-${device}-${slide === "question" ? "no_mic" : slide}.webp`,
  ...INTRO_SCREEN_SIZE[device],
});
