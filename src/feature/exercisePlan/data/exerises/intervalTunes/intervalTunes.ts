import { INTERVALS } from "feature/exercisePlan/intervals/intervalDefinitions";
import type {
  Exercise,
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// One short tune per interval — the "now play it" step that follows each lesson
// of the Interval Mastery learning path (feature/journey/data/intervalsJourney).
// Each is written by hand around a single interval, in the style and with the
// technique that interval is actually used for, so no two play alike. Single
// notes and the odd two-string double stop, which the mic scores as a chord.

/** MIDI pitch of each open string, 1 = high e .. 6 = low E. */
export const TUNE_OPEN_MIDI: Record<number, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

const DURATIONS: Record<string, number> = { t: 1 / 3, e: 0.5, q: 1, h: 2 };

/** How a note is reached, written right after its fret. */
const ARTICULATIONS: Record<string, Partial<TablatureNote>> = {
  "": {},
  h: { isHammerOn: true },
  p: { isPullOff: true },
  "/": { slideOut: 1 },
  m: { isPalmMute: true },
  b: { isBend: true, bendSemitones: 2 },
};

/**
 * One 4/4 bar from a compact line: `6.3q` is string 6, fret 3, a quarter note.
 * The last letter is the length: `t` a triplet eighth, `e` an eighth, `q` a
 * quarter, `h` a half; `-q` is a quarter rest. A mark between fret and length
 * says how the note is reached: `3.6ht` is hammered on from the note before it,
 * `2.5pt` pulled off to, `5.6/t` slides into the next note (picked on
 * arrival), `6.0me` is palm-muted, and `3.7bh` is bent up a whole step and
 * held. `6.0+5.1q` is a double stop: notes joined by `+` sound together, low
 * string first. Throws on a bar that doesn't add up to four beats, so a typo
 * fails the build instead of the tab.
 */
function bar(line: string): TablatureMeasure {
  const beats = line.split(" ").map((token): TablatureBeat => {
    const length = token.slice(-1);
    const duration = DURATIONS[length];
    const body = token.slice(0, -1);
    if (duration === undefined) throw new Error(`Interval tune: bad duration in "${token}"`);
    const tuplet = length === "t" ? { tuplet: 3 } : {};
    if (body === "-") return { duration, notes: [], ...tuplet };
    const notes = body.split("+").map((part): TablatureNote => {
      const match = /^(\d)\.(\d+)([hpmb/]?)$/.exec(part);
      if (!match) throw new Error(`Interval tune: bad note "${token}"`);
      const [string, fret] = [Number(match[1]), Number(match[2])];
      if (string < 1 || string > 6) throw new Error(`Interval tune: bad string in "${token}"`);
      return { string, fret, ...ARTICULATIONS[match[3]] };
    });
    return { duration, notes, ...tuplet };
  });
  const total = beats.reduce((sum, beat) => sum + beat.duration, 0);
  if (Math.abs(total - 4) > 1e-6) throw new Error(`Interval tune: bar "${line}" is ${total} beats long`);
  return { timeSignature: [4, 4], beats };
}

/** Names the chords over the downbeats, which is where the generated band reads
 *  them: one held from the first bar, or one for each bar. */
function withChord(measures: TablatureMeasure[], chord?: string | string[]): TablatureMeasure[] {
  if (!chord) return measures;
  return measures.map((measure, index) => {
    const name = typeof chord === "string" ? (index === 0 ? chord : undefined) : chord[index];
    if (!name) return measure;
    const [downbeat, ...beats] = measure.beats;
    return { ...measure, beats: [{ ...downbeat, chordName: name }, ...beats] };
  });
}

interface IntervalTune {
  /** Added to the title when the style matters to the band: "Blues" makes it shuffle. */
  genre?: string;
  /** Replaces the generated one-line description. Naming a key here ("A blues")
   *  tells the generated band which key and form to play. */
  description?: string;
  /** A chord the band holds under the whole tune, for lines its ear can't place
   *  in a key (a run of one interval belongs to no scale it knows). */
  chord?: string;
  /** Or a chord for each bar, when the tune is written over changes. */
  chords?: string[];
  /** A session band to play it, when the style is the point of the tune. */
  bandStyle?: Exercise["bandStyle"];
  /** "medium" unless it says otherwise. */
  difficulty?: Exercise["difficulty"];
  /** Recommended tempo; 70 when the tune doesn't say. */
  bpm?: number;
  /** Tempo the learning path locks its exam to; 70 when the tune doesn't say. */
  examBpm?: number;
  /** A few words for what it sounds like: "a prowling riff in E". */
  mood: string;
  /** What the tune does with the interval, for the instructions. */
  about: string;
  /** The one thing the hands need to know. */
  handTip: string;
  bars: string[];
}

const TUNES: Record<string, IntervalTune> = {
  // E phrygian: a palm-muted pedal on the open low string, with every accent a
  // half step away from the note it leans on (F over E, C over B, A♯ over A),
  // and a chromatic slide down to close. The flat 2 is the sound of the style.
  m2: {
    genre: "Metal",
    description: "A palm-muted metal riff in E phrygian built on half-step accents.",
    bpm: 100,
    examBpm: 90,
    mood: "a palm-muted metal riff",
    about:
      "The open low string chugs underneath, palm-muted. Every note that jumps out of the chug is one fret above it: F against E, then C against B and A♯ against A. The last bar walks down fret by fret.",
    handTip:
      "Rest the edge of your picking hand on the strings at the bridge for the chugs and lift it for the accents, so the half step rings out while the pedal stays tight.",
    bars: [
      "6.0me 6.0me 6.1e 6.0me 6.0me 6.1e 6.0me 6.1e",
      "6.0me 6.0me 6.1e 6.0me 6.4e 6.3e 6.1e 6.0e",
      "6.0me 6.0me 6.1e 6.0me 6.0me 6.1e 6.0me 6.1e",
      "6.0me 6.0me 6.1e 6.0me 5.2e 5.3e 5.2e 5.1e",
      "5.0me 5.0me 5.1e 5.0me 5.0me 5.1e 5.0me 5.1e",
      "5.0me 5.0me 5.1e 5.0me 5.4e 5.3e 5.1e 5.0e",
      "6.0me 6.0me 6.1q 6.0me 6.0me 6.1q",
      "6.4e 6.3e 6.2e 6.1e 6.0h",
    ],
  },
  // A dorian legato over a funk vamp: on the A, D, G and B strings frets 5 and
  // 7 are a whole step apart, so every hammer-on and pull-off is a major 2nd.
  // A hook climbs four strings and lands on a held note (bars 1 and 3), and
  // each time the answer is different: down to A with a rest, then up to the
  // high string. Bar 5 slides a whole step on the G string, bar 7 stretches to
  // three notes on one string, and the hook walks home to A.
  M2: {
    genre: "Legato",
    description: "A legato lick in A dorian over a funk vamp, made of whole steps.",
    chords: ["Am7", "D", "Am7", "D", "Am7", "D", "Am7", "Am7"],
    bandStyle: "strut",
    bpm: 90,
    examBpm: 80,
    mood: "a legato lick over a funk vamp",
    about:
      "Frets 5 and 7 on four strings in a row, and every pair is a whole step. Pick the first note on each string and hammer on to the second; coming back down, pull off. The hook climbs and lands on a long note, and each time the answer goes somewhere new. Listen for the slide in bar 5: the same whole step, without lifting the finger.",
    handTip:
      "Index on fret 5, ring finger on fret 7. Hammer straight down with the fingertip, and when you pull off, flick the string slightly sideways so the lower note speaks. Use the rests to reset the hand.",
    bars: [
      "5.5e 5.7he 4.5e 4.7he 3.5e 3.7he 2.5q",
      "2.7e 2.5pe 3.7e 3.5pe 4.7q -q",
      "5.5e 5.7he 4.5e 4.7he 3.5e 3.7he 2.5q",
      "2.5e 2.7he 1.5e 1.7he 1.5h",
      "1.7e 1.5pe 2.7e 2.5pe 3.7/e 3.9e 3.7pq",
      "3.5e 3.7he 2.5e 2.7he 2.5pe 3.7e 3.5q",
      "4.5e 4.7he 4.9he 4.7pe 4.5pe 5.7e 5.5pq",
      "5.7e 5.5pe 5.7he 4.5e 4.7h",
    ],
  },
  // Nothing but minor 3rds: two notes a string, three frets apart, the next
  // string picking up a minor 3rd higher. Four of them make an octave, so the
  // run is a diminished arpeggio from the open low E to the twelfth fret.
  m3: {
    genre: "Run",
    description: "A run across the whole neck where every move is a minor 3rd.",
    chord: "Edim7",
    bpm: 85,
    examBpm: 75,
    mood: "a run across the whole neck",
    about:
      "Every move in this run is a minor 3rd, with no other interval anywhere. Two notes on a string, three frets apart, then the next string carries on a minor 3rd higher. Four minor 3rds add up to an octave, so the same four notes keep coming back all the way to the twelfth fret.",
    handTip:
      "Index and pinky on every string, three frets apart. Shift the hand one fret up each time you cross to a higher string, and two frets when you cross from the G string to the B string.",
    bars: [
      "6.0e 6.3e 5.1e 5.4e 4.2e 4.5e 3.3e 3.6e",
      "2.5e 2.8e 1.6e 1.9e 1.12q 1.9e 1.6e",
      "2.8e 2.5e 3.6e 3.3e 4.5e 4.2e 5.4e 5.1e",
      "6.3e 6.0q 6.3e 5.1e 5.4e 5.1e 6.3e",
      "6.0e 6.3e 5.1e 6.3e 5.1e 5.4e 4.2e 5.4e",
      "4.2e 4.5e 3.3e 4.5e 3.3e 3.6e 2.5e 3.6e",
      "2.5e 2.8e 1.6e 2.8e 1.6e 1.9e 1.12e 1.9e",
      "1.12e 1.9e 1.6e 2.8e 2.5h",
    ],
  },
  // A country riff over A, D and E: the root bounces to its major 3rd one string
  // up and a fret back. Every other bar hammers the minor 3rd into the major,
  // the fret of difference the last two lessons were about.
  M3: {
    genre: "Country",
    description: "A country riff over A, D and E, root to major 3rd.",
    chords: ["A", "A", "D", "A", "E", "D", "A", "A"],
    bandStyle: "porch",
    bpm: 120,
    examBpm: 105,
    mood: "a country riff",
    about:
      "The root, then its major 3rd: one string up, one fret back. The riff bounces between the two and follows the chords from A to D to E. In the answering bars you land on the minor 3rd first and hammer it up one fret into the major, which is the oldest trick in country and blues guitar.",
    handTip:
      "Middle finger on the root, index on the 3rd. For the hammer-on, index plays the minor 3rd and the middle finger hammers the major 3rd right next to it.",
    bars: [
      "6.5e 5.4e 6.5e 5.4e 5.7e 5.4e 6.5q",
      "6.5e 5.3e 5.4he 6.5e 5.3e 5.4he 6.5e 5.4e",
      "5.5e 4.4e 5.5e 4.4e 4.7e 4.4e 5.5q",
      "6.5e 5.3e 5.4he 6.5e 5.3e 5.4he 6.5e 5.4e",
      "5.7e 4.6e 5.7e 4.6e 4.9e 4.6e 5.7q",
      "5.5e 4.4e 5.5e 4.4e 4.7e 4.4e 5.5q",
      "6.5e 5.4e 6.5e 5.4e 5.7e 5.4e 6.5q",
      "6.5e 5.3e 5.4he 6.5e 5.4q 6.5q",
    ],
  },
  // An arena anthem in D. The 4th is the leap melodies start with: the 5th of
  // the key jumping up to its root and landing on the beat (Here Comes the
  // Bride, Amazing Grace). Here it is the hook, A up to D, and every phrase
  // either opens with it or sings it on the way. The climb in bar 6 stacks two
  // 4ths, A–D–G, and the second one crosses from the G string to the B string,
  // where it moves up a fret. The last bar lands the hook an octave higher.
  P4: {
    genre: "Anthem",
    description: "An arena anthem in D where every phrase leaps up a 4th onto the beat.",
    chords: ["D", "G", "A", "A", "D", "G", "A", "D"],
    bandStyle: "synthwave",
    bpm: 104,
    examBpm: 92,
    mood: "an arena anthem",
    about:
      "A 4th is the leap a melody starts with: a short note, then up five frets onto the beat, landing somewhere that feels like home. The hook is A up to D, next string up at the same fret, and it comes back every few bars, until the last bar plays it an octave higher. In bar 6 two 4ths climb in a row, and the second crosses from the G string to the B string, where it sits one fret higher.",
    handTip:
      "Most 4ths here are the same fret on the next string: roll the finger across or use the next finger, and let the landing note ring its full length. In bar 6, reach one fret further for the B string.",
    bars: [
      "6.5q 5.5h 5.7e 4.4e",
      "4.5h 5.5q 4.5q",
      "5.7q 4.7h 4.5e 4.4e",
      "5.7h -q 6.5q",
      "5.5h 4.4q 3.4q",
      "4.7q 3.7q 2.8h",
      "2.7e 2.5e 1.5q 2.5q 3.6q",
      "4.7q 3.7h -q",
    ],
  },
  // Rock in E, and the tritone does two jobs, both as a double stop in one
  // shape: low string, next string up a fret higher. Over the E5 chug it is
  // root and flat 5, the evil power chord, stabbed between palm mutes. Over A7
  // and B7 the same shape is the chord's 3rd and flat 7, the two notes that
  // make a seventh chord, slid into from a fret below. The last bar moves the
  // flat 5 up one fret into a plain power chord, and the tension lets go.
  TT: {
    genre: "Rock",
    description: "A rock riff in E with tritone double stops: the evil power chord, and the heart of A7 and B7.",
    chords: ["E5", "E5", "E5", "E5", "A7", "B7", "E5", "E5"],
    bandStyle: "garage",
    bpm: 105,
    examBpm: 95,
    mood: "a rock riff",
    about:
      "One shape, two jobs. Fret a low string and the next string up one fret higher: that's a tritone. Over the chugging E it is the root and the flat 5, the most unsettling power chord there is. Over A7 and B7 the same shape gives the chord's 3rd and flat 7, the two notes that make a seventh chord sound like one; slide into it from a fret below. At the very end the flat 5 moves up one fret to a plain power chord and everything relaxes.",
    handTip:
      "Index on the low string, middle finger one string up and one fret higher, and play both strings in one stroke. Rest the edge of your picking hand on the low E for the chugs and lift it for the stabs.",
    bars: [
      "6.0me 6.0me 6.0+5.1q 6.0me 6.0me 6.3e 6.5e",
      "6.0me 6.0me 6.0+5.1q 6.5+5.6q 6.0me 6.0me",
      "6.0me 6.0me 6.0+5.1q 6.0me 6.0me 6.3e 6.5e",
      "6.0me 6.0me 6.0+5.1q 5.1e 5.2e 6.5q",
      "5.3+4.4e 5.4+4.5q 5.4+4.5e -e 5.4+4.5e 6.5e 6.5e",
      "5.5+4.6e 5.6+4.7q 5.6+4.7e -e 5.6+4.7e 6.7e 6.7e",
      "6.0me 6.0me 6.0+5.1q 6.0me 6.0me 5.1e 5.2e",
      "6.0+5.1h 6.0+5.2h",
    ],
  },
  // Stacked 5ths in G major: C–G–D–A–E–B–F♯ is one unbroken chain of 5ths, all
  // of it in the key, so a cascade can run six strings high (G D A E B F♯, fret
  // 3 to fret 14) without leaving it. Bars 5–6 climb the same stacks three
  // strings at a time.
  P5: {
    genre: "Cascade",
    difficulty: "hard",
    description: "Cascades of stacked 5ths in G major across all six strings.",
    bpm: 80,
    examBpm: 70,
    mood: "cascades of stacked 5ths",
    about:
      "Each note is a 5th above the one before it: next string up, two frets higher. Six of them in a row carry you from the low G at the third fret to an F♯ at the fourteenth, and every one of them belongs to G major. The cascade falls back the same way, then climbs again in three-string steps.",
    handTip:
      "Index, ring finger, pinky, then shift: the hand slides up the neck as it crosses the strings. From the G string to the B string the 5th is three frets higher, not two.",
    bars: [
      "6.3e 5.5e 4.7e 3.9e 2.12e 1.14q 2.12e",
      "3.9e 4.7e 5.5e 6.3q 5.5e 4.7e 3.9e",
      "3.7e 4.5e 5.3q 4.5e 3.7e 2.10e 1.12e",
      "2.10e 3.7e 4.5e 5.3q 4.5e 3.7q",
      "6.0e 5.2e 4.4e 5.2e 6.3e 5.5e 4.7e 5.5e",
      "6.5e 5.7e 4.9e 5.7e 6.8e 5.10e 4.12e 5.10e",
      "1.14e 2.12e 3.9e 4.7e 5.5e 6.3q 5.5e",
      "4.7e 3.9e 2.12e 3.9e 4.7e 5.5e 6.3q",
    ],
  },
  // A spaghetti-western theme in A minor. Every phrase rides up a minor 6th and
  // sinks a half step: A–F–E, E–C–B, D–B♭–A. Over the E chord the same leap is
  // G♯ up to E, the dominant's own minor 6th.
  m6: {
    genre: "Western",
    description: "A spaghetti-western theme in A minor built on minor 6th leaps.",
    chords: ["Am", "Am", "E", "Am", "Am", "Dm", "E", "Am"],
    bandStyle: "tide",
    bpm: 110,
    examBpm: 100,
    mood: "a spaghetti-western theme",
    about:
      "Two quick notes like hoofbeats, a leap up a minor 6th, then the top note sinks one fret. A to F to E, E to C to B: that leap and fall is the whole melancholy of a minor key in three notes. Over the E chord the leap is G♯ up to E.",
    handTip:
      "The leap skips a string each time, so pick the low note down and the high note up. Let the long note after each fall ring until the next hoofbeats.",
    bars: [
      "5.0e 5.0e 4.3q 4.2h",
      "4.2e 4.2e 3.5q 3.4h",
      "6.4e 6.4e 4.2q 4.2e 6.4e 4.2q",
      "5.0q 4.3e 4.2e 5.0h",
      "4.2e 3.5e 3.4e 4.2e 3.5q 3.4q",
      "4.0e 4.0e 3.3q 3.2h",
      "6.4e 4.2e 6.4e 4.2e 5.2e 3.0e 4.3e 4.2e",
      "5.0e 4.3e 4.2q 5.0h",
    ],
  },
  // Soul 6ths in A: on the G and high E strings a major 6th is the same fret on
  // both, played low then high. The shape slides in from two frets below (D–B up
  // to E–C♯ over A) and sits at fret 2 for D and fret 4 for E.
  M6: {
    genre: "Soul",
    description: "A soul guitar part in A major in broken, sliding 6ths.",
    chords: ["A", "A", "D", "A", "A", "D", "E", "A"],
    bpm: 85,
    examBpm: 75,
    mood: "a soul guitar part in broken 6ths",
    about:
      "On the G string and the high E string, the same fret on both is a major 6th. Play the low note, then the high one, and slide the whole shape two frets up into the chord: fret 7 to fret 9 for A, fret 2 to fret 4 for E. It is the fill behind a thousand soul and country records.",
    handTip:
      "Middle finger on the G string, ring finger on the high E string, and keep them as one shape when you slide. Skip the B string with the pick, or pluck the high note with a free finger.",
    bars: [
      "3.7/e 3.9e 1.9q 1.7e 3.7e 3.9e 1.9e",
      "1.9q 3.9e 3.7e 1.7e 1.9e 3.9q",
      "3.4/e 3.2e 1.2q 1.4e 3.4e 3.2e 1.2e",
      "3.7/e 3.9e 1.9q 3.9e 1.9e 1.9q",
      "3.9e 1.9e 3.7/e 3.9e 1.9h",
      "3.2e 1.2e 1.4e 3.4/e 3.2e 1.2e 3.2q",
      "3.2/e 3.4e 1.4q 1.2e 3.2/e 3.4e 1.4e",
      "3.7/e 3.9e 1.9q 3.9h",
    ],
  },
  // Blues-rock in E: the root kicks up to its flat 7 two strings higher, same
  // fret, then the 7 tumbles down through the 6 to the 5. E7 takes it on open
  // strings, A7 and B7 at the fifth and seventh fret, and an octave up the same
  // call answers, where the B string pushes the 7 one fret higher.
  m7: {
    genre: "Rock",
    description: "A blues-rock riff in E: the root kicks up to its flat 7 over E7, A7 and B7.",
    chords: ["E7", "E7", "A7", "E7", "E7", "A7", "B7", "E7"],
    bandStyle: "garage",
    bpm: 120,
    examBpm: 105,
    mood: "a blues-rock riff",
    about:
      "The root, then the note a minor 7th above it: two strings higher, same fret. That top note is the flat 7, the one that turns a plain chord into a blues chord. It tumbles down two notes and the riff starts over. The shape moves to the fifth fret for A7 and the seventh for B7, and every other bar it answers an octave higher.",
    handTip:
      "The leap skips a string, so let the pick travel past it without touching. In the high answer the 7th is on the B string, one fret further than the shape you just used.",
    bars: [
      "6.0e 6.0e 4.0q 6.0e 4.0e 5.4e 5.2e",
      "4.2e 2.3e 2.2e 2.0e 4.2e 2.3q 4.2e",
      "6.5e 6.5e 4.5q 6.5e 4.5e 4.4e 4.2e",
      "6.0e 6.0e 4.0q 6.0e 4.0e 5.4e 5.2e",
      "4.2e 2.3e 2.2e 2.0e 4.2e 2.3q 4.2e",
      "4.7e 2.8e 2.7e 2.5e 4.7e 2.8q 4.7e",
      "6.7e 6.7e 4.7q 6.7e 4.7e 4.6e 4.4e",
      "6.0e 6.0e 4.0q 5.4e 5.2e 6.0q",
    ],
  },
  // One shape over five maj7 chords: the root, then its major 7th two strings up
  // and a fret higher, nudged into the octave and let fall back, then the whole
  // chord climbed root, 3rd, 5th, 7th. C and F, then E♭, A♭ and D♭ borrowed from
  // outside the key, and home to C, resolved at last.
  M7: {
    genre: "Jazz",
    description: "A jazz line over five maj7 chords: root to major 7th, then the whole arpeggio.",
    chords: ["Cmaj7", "Fmaj7", "Cmaj7", "Fmaj7", "Ebmaj7", "Abmaj7", "Dbmaj7", "Cmaj7"],
    bandStyle: "loft",
    bpm: 90,
    examBpm: 80,
    mood: "a jazz line",
    about:
      "The root of the chord, then the note a major 7th above it: two strings up, one fret higher. It sits a single fret below the octave, so the line nudges it up and lets it fall back, then climbs the whole chord, root, 3rd, 5th, 7th, to reach it again. The same shape follows five chords around the neck, and only the very last bar lets it rest on the octave.",
    handTip:
      "Middle finger on the root, ring finger on the 7th, pinky for the octave above it. The arpeggio in the second half of the bar starts from the same root, so the hand never has to leave the position.",
    bars: [
      "5.3e 3.4e 3.5e 3.4e 5.3e 4.2e 4.5e 3.4e",
      "6.1e 4.2e 4.3e 4.2e 6.1e 5.0e 5.3e 4.2e",
      "5.3e 3.4e 5.3e 3.4e 3.5q 3.4q",
      "6.1e 4.2e 6.1e 4.2e 4.3q 4.2q",
      "5.6e 3.7e 3.8e 3.7e 5.6e 4.5e 4.8e 3.7e",
      "6.4e 4.5e 4.6e 4.5e 6.4e 5.3e 5.6e 4.5e",
      "5.4e 3.5e 5.4e 3.5e 3.6q 3.5q",
      "5.3q 3.4q 3.5h",
    ],
  },
  // Disco octaves over Am, F, C and G: low note, then the same note an octave up.
  // From the two low strings the octave is two strings up and two frets over; from
  // the D and G strings it has to cross the G–B gap, and the shape widens to three.
  P8: {
    genre: "Disco",
    description: "Disco octaves over Am, F, C and G.",
    chords: ["Am", "F", "C", "G", "Am", "F", "C", "G"],
    bandStyle: "neon",
    bpm: 115,
    examBpm: 100,
    mood: "a disco octave line",
    about:
      "A low note and the same note an octave higher, bounced in a three-three-two rhythm. For the first four bars the octave is two strings up and two frets over. Then the line moves to the higher strings, where the octave has to cross from G to B, and the same shape is suddenly three frets wide.",
    handTip:
      "Index on the low note, pinky on the high one, and mute the string between them with the underside of the index finger. When the line moves up, open the hand by one more fret.",
    bars: [
      "6.5e 4.7e 4.7e 6.5e 4.7e 4.7e 6.5e 4.7e",
      "6.1e 4.3e 4.3e 6.1e 4.3e 4.3e 6.1e 4.3e",
      "5.3e 3.5e 3.5e 5.3e 3.5e 3.5e 5.3e 3.5e",
      "6.3e 4.5e 4.5e 6.3e 4.5e 4.5e 6.3e 4.5e",
      "4.7e 2.10e 2.10e 4.7e 2.10e 2.10e 4.7e 2.10e",
      "4.3e 2.6e 2.6e 4.3e 2.6e 2.6e 4.3e 2.6e",
      "3.5e 1.8e 1.8e 3.5e 1.8e 1.8e 3.5e 1.8e",
      "4.5e 2.8e 4.5e 2.8e 6.5h",
    ],
  },
};

const slugOf = (name: string) => name.toLowerCase().replace(/ /g, "_");

/** The octave: outside the eleven intervals the drills ask for, but it has a piece to play too. */
export const OCTAVE = { id: "P8", name: "Octave", degree: "8", semitones: 12 };

/** The tempo the learning path examines an interval's tune at. */
export const intervalTuneExamBpm = (intervalId: string): number => TUNES[intervalId]?.examBpm ?? 70;

export const intervalTuneExercises: Exercise[] = [...INTERVALS, OCTAVE].map((interval): Exercise => {
  const tune = TUNES[interval.id];
  const name = interval.name.toLowerCase();
  return {
    id: `interval_tunes_${slugOf(interval.name)}`,
    addedAt: "2026-11-20",
    isHiddenFromLanding: true,
    title: `Interval Tunes — ${interval.name}${tune.genre ? ` ${tune.genre}` : ""}`,
    description: tune.description ?? `Eight bars of ${tune.mood}, built on the ${name}.`,
    whyItMatters: `An interval only sticks once you've heard it do a job in real music. This piece is built on the ${name}, so your hand learns the shape and your ear learns what it is for.`,
    difficulty: tune.difficulty ?? "medium",
    category: "theory",
    timeInMinutes: 1.5,
    instructions: [
      tune.about,
      "Loop it with the click, slower than the suggested tempo at first, and bring the tempo up once it is clean.",
      `Every time the ${name} comes round, notice it. That is the sound you are here for.`,
    ],
    tips: [
      tune.handTip,
      "Listen to the tab once before you play, so you know where it is going.",
      "Clean beats fast: a wrong note at full tempo teaches the hand the wrong shape.",
    ],
    metronomeSpeed: { min: 50, max: 120, recommended: tune.bpm ?? 70 },
    relatedSkills: ["harmony", "music_theory"],
    tablature: withChord(tune.bars.map(bar), tune.chords ?? tune.chord),
    ...(tune.bandStyle ? { bandStyle: tune.bandStyle } : {}),
  };
});
