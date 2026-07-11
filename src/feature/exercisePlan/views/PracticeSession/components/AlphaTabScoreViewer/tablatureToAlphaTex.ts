import type { TablatureBeat, TablatureMeasure, TablatureNote } from "feature/exercisePlan/types/exercise.types";

// alphaTex duration codes are the denominator of the note value (4 = quarter, 8 = eighth, …).
// Our own model stores duration as a fraction of a quarter note, so the code is 4 / duration.
const DURATION_CODES = [1, 2, 4, 8, 16, 32, 64];

// alphaTex's default tuplet denominator per numerator (matches AlphaTab's own
// AlphaTex1LanguageHandler._getTupletDenominator: 3→2, 5/6/7→4, 9/10/11/12→8).
// A tuplet packs `numerator` notes into the time of `denominator` — e.g. a triplet
// (3) packs 3 notes into the time of 2, so each one sounds for 2/3 of its notated length.
const TUPLET_DENOMINATORS: Record<number, number> = { 3: 2, 5: 4, 6: 4, 7: 4, 9: 8, 10: 8, 11: 8, 12: 8 };

const HARMONIC_TAGS: Record<number, string> = { 1: "nh", 2: "ah", 3: "th", 4: "ph", 5: "sh" };
const SLIDE_IN_TAGS: Record<number, string> = { 1: "sib", 2: "sia" };
// slideOut 3 ("SlideTo") has no dedicated alphaTex counterpart — closest is a legato slide.
const SLIDE_OUT_TAGS: Record<number, string> = { 1: "ss", 2: "sl", 3: "sl" };

interface ResolvedDuration {
  code: number;
  dots: number;
}

// Our model stores `beat.duration` as the note's actual *sounding* length (a fraction
// of a quarter note) — for tuplets this is already time-compressed (a triplet eighth
// sounds for 1/3 of a quarter, not 1/2). alphaTex instead wants the *notated* base
// duration (its own `{tu N}` effect re-compresses it at render time), and has no
// fractional duration for dotted notes — those are a separate `{d}`/`{dd}` beat effect
// layered on top of the nearest power-of-two base.
//
// Getting either wrong (as the previous version did — it ignored `beat.tuplet` entirely
// and had no dotted-note handling) makes a measure's total notated length silently
// mismatch its declared `\ts`, which visibly desyncs the notation from the actual bars
// as the piece progresses.
function resolveDuration(duration: number, tuplet?: number): ResolvedDuration {
  if (!duration || duration <= 0) return { code: 4, dots: 0 };

  const tupletDenominator = tuplet ? TUPLET_DENOMINATORS[tuplet] : undefined;
  // Undo the tuplet's time compression to recover the notated base duration.
  const notated = tupletDenominator ? duration * (tuplet! / tupletDenominator) : duration;

  const EPS = 1e-3;
  for (const code of DURATION_CODES) {
    const base = 4 / code;
    if (Math.abs(notated - base) < EPS) return { code, dots: 0 };
    if (Math.abs(notated - base * 1.5) < EPS) return { code, dots: 1 };
    if (Math.abs(notated - base * 1.75) < EPS) return { code, dots: 2 };
  }

  // Fallback: nearest base duration, no dot (previous, imprecise behaviour) — used
  // only for values that don't cleanly resolve to a plain/dotted/tupleted note.
  const raw = 4 / notated;
  const code = DURATION_CODES.reduce((closest, candidate) =>
    Math.abs(candidate - raw) < Math.abs(closest - raw) ? candidate : closest,
  );
  return { code, dots: 0 };
}

// AlphaTab bend points: offset is 0..60 across the note. `value` is in half-semitone
// (50 cents) units — confirmed against MidiFileGenerator.getPitchWheel, which derives the
// actual playback pitch shift as `value / 2` semitones. Using 25-cents-per-unit (as if
// `value` matched a semitone directly at *4) doubles every bend audibly.
function bendEffect(note: TablatureNote): string | null {
  if (note.bendCurve && note.bendCurve.length > 0) {
    const points = note.bendCurve
      .map((point) => {
        const offset = Math.max(0, Math.min(60, Math.round(point.position * 60)));
        const value = Math.max(0, Math.round(point.cents / 50));
        return `${offset} ${value}`;
      })
      .join(" ");
    return `be (${points})`;
  }
  if (note.isBend || note.bendSemitones || note.isPreBend || note.isRelease) {
    const units = Math.max(1, Math.round((note.bendSemitones ?? 1) * 2));
    if (note.isPreBend && note.isRelease) return `b (${units} ${units} 0)`;
    if (note.isPreBend) return `b (${units} ${units})`;
    if (note.isRelease) return `b (${units} 0)`;
    return `b (0 ${units})`;
  }
  return null;
}

function noteEffects(note: TablatureNote): string {
  const effects: string[] = [];
  const bend = bendEffect(note);
  if (bend) effects.push(bend);
  if (note.isHammerOn || note.isPullOff) effects.push("h");
  if (note.isTap) effects.push("lht");
  if (note.isGhost) effects.push("g");
  if (note.isAccented) effects.push("ac");
  if (note.isPalmMute) effects.push("pm");
  if (note.isStaccato) effects.push("st");
  if (note.isLetRing) effects.push("lr");
  if (note.isVibrato) effects.push("v");
  if (note.isDead) effects.push("x");
  if (note.harmonicType && HARMONIC_TAGS[note.harmonicType]) effects.push(HARMONIC_TAGS[note.harmonicType]);
  if (note.slideIn && SLIDE_IN_TAGS[note.slideIn]) effects.push(SLIDE_IN_TAGS[note.slideIn]);
  if (note.slideOut && SLIDE_OUT_TAGS[note.slideOut]) effects.push(SLIDE_OUT_TAGS[note.slideOut]);
  return effects.length > 0 ? `{${effects.join(" ")}}` : "";
}

// Our TablatureNote.string uses "1 = high E" (musician-friendly, top line of the tab).
// The alphaTex *text* syntax (`fret.string`) uses the exact same "1 = high E" convention —
// confirmed against AlphaTexImporter: `0.1` parses to realValue 64 (E4/high e), `0.6` to
// realValue 40 (E2/low E). No flip needed here.
// (This is the opposite of the *parsed model's* `Note.string`, where 1 = lowest string —
// that's what useNoteHeadFeedback flips against, for notes read back out of an already
// loaded score. Don't reuse that flip for text generation, the conventions differ.)
function noteTex(note: TablatureNote): string {
  return `${note.fret}.${note.string}${noteEffects(note)}`;
}

function beatTex(beat: TablatureBeat): string {
  const { code: duration, dots } = resolveDuration(beat.duration, beat.tuplet);
  const content =
    beat.notes.length === 0
      ? "r"
      : beat.notes.length === 1
        ? noteTex(beat.notes[0])
        : `(${beat.notes.map(noteTex).join(" ")})`;
  const beatEffectTokens: string[] = [];
  if (beat.tuplet) beatEffectTokens.push(`tu ${beat.tuplet}`);
  if (dots === 1) beatEffectTokens.push("d");
  if (dots === 2) beatEffectTokens.push("dd");
  const beatEffects = beatEffectTokens.length > 0 ? ` {${beatEffectTokens.join(" ")}}` : "";
  return `${content}.${duration}${beatEffects}`;
}

/**
 * Converts our own `TablatureMeasure[]` format into alphaTex — the text markup
 * AlphaTab can render directly via `api.tex(...)`, without needing a real Guitar
 * Pro file. Lets the ~180 built-in exercises (which only ever ship `tablature`,
 * never a `.gp` file) render standard notation, not just tab.
 */
export function tablatureToAlphaTex(measures: TablatureMeasure[], baseTempo = 120): string {
  let prevTimeSignature: [number, number] | null = null;

  const bars = measures.map((measure, index) => {
    const meta: string[] = [];
    if (index === 0) meta.push(`\\tempo ${Math.round(baseTempo)}`);
    if (measure.tempoChange) meta.push(`\\tempo ${Math.round(baseTempo * measure.tempoChange)}`);
    const [numerator, denominator] = measure.timeSignature;
    if (!prevTimeSignature || prevTimeSignature[0] !== numerator || prevTimeSignature[1] !== denominator) {
      meta.push(`\\ts ${numerator} ${denominator}`);
      prevTimeSignature = measure.timeSignature;
    }
    const beats = measure.beats.map(beatTex).join(" ");
    return `${meta.length > 0 ? `${meta.join(" ")} ` : ""}${beats} |`;
  });

  return bars.join("\n");
}
