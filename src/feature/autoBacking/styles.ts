import type { Rng } from "./arrange";
import type { GrooveId } from "./grooves";

/**
 * The band the backing is played by. The groove decides the feel (a waltz,
 * a shuffle, a half-time); the style decides who plays it: their instruments
 * and the figures they play in a plain 4/4 bar. All of them synthesised and
 * electronic — a synth never sounds like a bad drummer.
 *
 * - `ambient`: wide detuned pad, sub bass, soft 808 kit, long hall.
 * - `lofi`: an electric piano comping, a round bass, a dusty kit, darker overall.
 * - `synthwave`: a brassy poly synth, octave-pulsing bass, gated snare, sixteenth hats.
 * - `house`: four on the floor, a clap, off-beat bass, chord stabs.
 * - `dark`: slow strings, a detuned reese bass, a heavy kit.
 */
export const BAND_STYLES = [
  "ambient",
  "lofi",
  "synthwave",
  "house",
  "dark",
] as const;

export type BandStyleId = (typeof BAND_STYLES)[number];

export const isBandStyle = (value: unknown): value is BandStyleId =>
  typeof value === "string" &&
  (BAND_STYLES as readonly string[]).includes(value);

/** What the player picked in the volume menu: a style, or let the exercise decide. */
export type BandStylePreference = BandStyleId | "auto";

const HEAVY: ReadonlySet<GrooveId> = new Set(["metal", "doom", "thrash"]);

/**
 * The styles that suit an exercise. Heavy riffs get the dark band; otherwise
 * the tempo decides: four on the floor only where a dance floor would have
 * it, the slow electric piano only where it has room to breathe.
 */
export function styleCandidates(groove: GrooveId, bpm: number): BandStyleId[] {
  if (groove === "boss") return ["ambient"];
  if (HEAVY.has(groove)) return ["dark"];
  if (groove === "shuffle") return ["lofi", "ambient"];
  if (groove === "waltz" || groove === "compound") return ["ambient", "lofi"];
  if (bpm < 100) return ["ambient", "lofi", "synthwave"];
  if (bpm <= 135) return ["house", "synthwave", "ambient"];
  return ["synthwave", "ambient"];
}

/**
 * The style an exercise is played in: the player's pick, or one of the styles
 * that suit it, drawn from its own seed — the same exercise always sounds the
 * same, and the library as a whole doesn't.
 */
export function chooseStyle(
  groove: GrooveId,
  bpm: number,
  rng: Rng,
  preference: BandStylePreference = "auto",
): BandStyleId {
  if (groove === "boss") return "ambient";
  if (preference !== "auto") return preference;
  const candidates = styleCandidates(groove, bpm);
  return candidates[Math.floor(rng() * candidates.length) % candidates.length];
}
