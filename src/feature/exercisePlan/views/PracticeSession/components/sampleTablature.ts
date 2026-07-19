import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

/**
 * Demo riff rendered in the tablature settings preview.
 *
 * It is written to exercise every layer the settings can toggle rather than to
 * be musically interesting: a chord name, notes on all six strings, a rest,
 * varied note durations (so the rhythm lane shows stems, beams and flags) and
 * one of each technique marker the renderer knows how to draw.
 */
export const SAMPLE_TABLATURE: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      // Chord stab — drives the chord-name pill.
      {
        duration: 1,
        chordName: "Am",
        notes: [
          { string: 5, fret: 0 },
          { string: 4, fret: 2 },
          { string: 3, fret: 2 },
          { string: 2, fret: 1 },
        ],
      },
      // Deliberately no accents anywhere in this riff: the renderer dims every
      // non-accented note to 25% as soon as one accent exists, which would make
      // the whole palette preview look washed out.
      { duration: 0.5, notes: [{ string: 3, fret: 2 }] },
      { duration: 0.5, notes: [{ string: 2, fret: 1 }] },
      // Hammer-on / pull-off pair — draws the slur arc with H and P labels.
      { duration: 0.5, notes: [{ string: 1, fret: 5 }] },
      { duration: 0.5, notes: [{ string: 1, fret: 7, isHammerOn: true }] },
      { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      { duration: 0.5, notes: [{ string: 2, fret: 5, isPalmMute: true }] },
    ],
  },
  {
    timeSignature: [4, 4],
    beats: [
      // Full bend — badge above the block with a connector line.
      {
        duration: 1,
        notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }],
      },
      // Held note with vibrato — wavy outline over a long pill.
      { duration: 1.5, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      { duration: 0.5, notes: [{ string: 4, fret: 5, isStaccato: true }] },
      // Rest — rhythm lane draws the rest glyph here.
      { duration: 1, notes: [] },
    ],
  },
  {
    timeSignature: [4, 4],
    beats: [
      // Natural harmonic — outlined pill plus the N.H. badge.
      { duration: 1, notes: [{ string: 5, fret: 12, harmonicType: 1 }] },
      { duration: 0.5, notes: [{ string: 6, fret: 3, isDead: true }] },
      { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
      { duration: 0.5, notes: [{ string: 5, fret: 7, isTap: true }] },
      { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
      // Let-ring tail — dashed line trailing past the block.
      { duration: 1, notes: [{ string: 3, fret: 9, isLetRing: true }] },
    ],
  },
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 0.5, notes: [{ string: 1, fret: 12 }] },
      { duration: 0.5, notes: [{ string: 2, fret: 12 }] },
      { duration: 0.5, notes: [{ string: 3, fret: 12 }] },
      { duration: 0.5, notes: [{ string: 4, fret: 12 }] },
      { duration: 0.5, notes: [{ string: 5, fret: 12 }] },
      { duration: 0.5, notes: [{ string: 6, fret: 12 }] },
      // Whole-ish closing chord so sustain tails are visible in the 3D highway.
      {
        duration: 1,
        chordName: "E5",
        notes: [
          { string: 6, fret: 0 },
          { string: 5, fret: 2 },
          { string: 4, fret: 2 },
        ],
      },
    ],
  },
];

/** Tempo the preview renders at — slow enough that the 3D highway reads clearly. */
export const SAMPLE_TEMPO = 90;
