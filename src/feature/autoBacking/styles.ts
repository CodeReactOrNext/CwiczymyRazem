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

/** A band a player may pick, and an exercise may be dealt. */
export type PlayerBandStyle = (typeof BAND_STYLES)[number];

/**
 * The session bands: one for each client of a guild's recording sessions
 * (feature/guilds/data/guildRecording), and played nowhere else. A recording
 * names its band outright, so none of them is in the volume menu and none is
 * ever dealt to an exercise — they are what a session sounds like.
 *
 * - `garage` (punk): a crunching rhythm guitar in eighths, a picked bass, a
 *   tight loud kit.
 * - `juke` (blues): a drawbar organ, a thumping walking bass, brushes on a
 *   shuffle.
 * - `neon` (synth-pop): a pulse-wave poly synth off the beat, a sequenced
 *   bass, a drum machine.
 * - `porch` (folk): strummed strings, a boom-chick bass, a shaker and a rim.
 * - `forge` (metal): a chugging gallop, the bass under it, double kick.
 * - `loft` (fusion): an FM piano comping, a gliding bass, a busy ride.
 * - `strut` (funk): a clavinet scratching sixteenths, a slapped bass, ghost
 *   notes all over a tight kit.
 * - `yard` (reggae): an organ chop on the off-beats, a deep slow bass, a
 *   one-drop — the kick only on three — with a long dub echo.
 * - `tide` (surf): a twangy tremolo guitar drenched in reverb, a bass
 *   rocking root to fifth, the snare on two, two-and and four.
 */
export const STUDIO_STYLES = [
  "garage",
  "juke",
  "neon",
  "porch",
  "forge",
  "loft",
  "strut",
  "yard",
  "tide",
] as const;

export type StudioStyleId = (typeof STUDIO_STYLES)[number];

export type BandStyleId = PlayerBandStyle | StudioStyleId;

export const isBandStyle = (value: unknown): value is PlayerBandStyle =>
  typeof value === "string" &&
  (BAND_STYLES as readonly string[]).includes(value);

export const isStudioStyle = (value: unknown): value is StudioStyleId =>
  typeof value === "string" &&
  (STUDIO_STYLES as readonly string[]).includes(value);

/** What the player picked in the volume menu: a style, or let the exercise decide. */
export type BandStylePreference = PlayerBandStyle | "auto";

const HEAVY: ReadonlySet<GrooveId> = new Set(["metal", "doom", "thrash"]);

/**
 * The styles that suit an exercise. Heavy riffs get the dark band; otherwise
 * the tempo decides: four on the floor only where a dance floor would have
 * it, the slow electric piano only where it has room to breathe.
 */
export function styleCandidates(
  groove: GrooveId,
  bpm: number,
): PlayerBandStyle[] {
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
 * same, and the library as a whole doesn't. A session band is never drawn: it
 * only plays when the exercise itself names it.
 */
export function chooseStyle(
  groove: GrooveId,
  bpm: number,
  rng: Rng,
  preference: BandStyleId | "auto" = "auto",
): BandStyleId {
  if (groove === "boss") return "ambient";
  if (preference !== "auto") return preference;
  const candidates = styleCandidates(groove, bpm);
  return candidates[Math.floor(rng() * candidates.length) % candidates.length];
}
