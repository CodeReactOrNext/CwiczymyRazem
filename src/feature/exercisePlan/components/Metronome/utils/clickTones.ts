// Shared click sound definitions for the desktop (AudioWorklet) and mobile
// (setTimeout) metronome engines — kept in one place so a beat and a
// subdivision tick always sound the same regardless of which engine is
// running.
export type ClickKind = "accent" | "beat" | "sub";

export const CLICK_TONES: Record<ClickKind, { frequency: number; gainScale: number }> = {
  accent: { frequency: 1200, gainScale: 1 },
  beat: { frequency: 800, gainScale: 1 },
  // Subdivision ticks (the clicks *between* beats) stay audibly softer and
  // lower-pitched than a real beat so the downbeat is never ambiguous.
  sub: { frequency: 600, gainScale: 0.5 },
};
