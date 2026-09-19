// AlphaTab brings its own built-in metronome click, and while a Guitar Pro file
// drives the session that click is the *only* one the player hears (the device
// metronome mutes its steady click there). The volume popover's metronome slider
// therefore has to reach AlphaTab as well — wiring only the mute toggle to it left
// the slider looking connected while nothing but muting ever did anything.
//
// The session metronome's own level runs 0..1 and sits at 0.5 by default, while
// AlphaTab treats 1 as the click's normal loudness. Mapping 0.5 → 1 keeps the
// default click exactly as loud as it has always been and lets the top of the
// slider make it twice as loud, the same shape as the Guitar Pro boost slider.

/** AlphaTab gain at the very top of the 0..1 metronome slider. */
export const ALPHATAB_CLICK_MAX_GAIN = 2;

/** Session metronome level (0..1, default 0.5) + mute → AlphaTab `metronomeVolume`. */
export const toAlphaTabClickVolume = (volume = 0.5, isMuted = false): number => {
  if (isMuted) return 0;
  const level = Number.isFinite(volume) ? volume : 0.5;
  return Math.min(ALPHATAB_CLICK_MAX_GAIN, Math.max(0, level * ALPHATAB_CLICK_MAX_GAIN));
};
