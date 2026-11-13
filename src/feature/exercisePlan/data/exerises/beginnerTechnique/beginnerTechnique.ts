import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureBeat,
} from "feature/exercisePlan/types/exercise.types";

const ADDED = "2026-11-13";

const quarters = (positions: [number, number][]): TablatureBeat[] =>
  positions.map(([string, fret]) => beat(1, note(string, fret)));

// ── Picking ──────────────────────────────────────────────────────────────────

/** Open-string eighth notes with the stroke marked: down on the beat, up after it. */
const downUp = (strings: number[]): TablatureBeat[] =>
  strings.map((string, i) =>
    beat(0.5, note(string, 0), { pickStroke: i % 2 === 0 ? "down" : "up" }),
  );

const G = 3;
const B = 2;

export const alternatePickingFirstDownUpExercise: Exercise = {
  id: "alternate_picking_first_down_up",
  addedAt: ADDED,
  title: "Alternate Picking — First Down-Up",
  description:
    "Down on the beat, up between the beats — on open strings, so the picking hand is the only thing to think about.",
  whyItMatters:
    "Alternate picking is how almost everything faster than a slow melody gets played. Tying the downstroke to the beat from day one means your hand keeps time by itself later, when the notes get harder.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Follow the marks above the tab: ⊓ is a downstroke, ⋁ is an upstroke.",
    "Bars 1–2: eight notes on the open G string, then eight on the open B string.",
    "Bars 3–4: change string every four notes, then every two.",
    "Keep the down-up motion going even when you change strings.",
  ],
  tips: [
    "Move the pick from the wrist, only as far as it takes to clear the string.",
    "Upstrokes are usually quieter at first — listen and even them out.",
    "Hold the pick firmly enough that it does not turn, loosely enough that the hand stays relaxed.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["alternate_picking", "rhythm"],
  tablature: [
    bar(downUp([G, G, G, G, G, G, G, G])),
    bar(downUp([B, B, B, B, B, B, B, B])),
    bar(downUp([G, G, G, G, B, B, B, B])),
    bar([
      ...downUp([G, G, B, B, G, G]),
      beat(1, note(B, 0), { pickStroke: "down" }),
    ]),
  ],
};

export const pickingOpenStringCrossingExercise: Exercise = {
  id: "picking_open_string_crossing",
  addedAt: ADDED,
  title: "Picking — Crossing the Open Strings",
  description:
    "One note per click on the open strings, moving to the next string each time — up, down and back across all six.",
  whyItMatters:
    "Before the fretting hand does anything, the pick has to find the right string without you looking. This is the drill for that: it teaches the picking hand the distance between strings.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play one open string per click, with a downstroke.",
    "Bar 1 runs from the low E string towards the thin strings; the next bars turn around and come back.",
    "Stop the string you just played by resting the pick or a finger on it as you move on.",
    "Try it without looking at the picking hand.",
  ],
  tips: [
    "Rest the side of the hand lightly on the bridge — it gives the pick a fixed point to measure from.",
    "Say the string names as you go: E, A, D, G, B, E.",
    "When it is steady, repeat it with alternate picking: down, up, down, up.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["alternate_picking", "rhythm"],
  tablature: [
    bar(quarters([[6, 0], [5, 0], [4, 0], [3, 0]])),
    bar(quarters([[2, 0], [1, 0], [2, 0], [3, 0]])),
    bar(quarters([[4, 0], [5, 0], [6, 0], [5, 0]])),
    bar(quarters([[4, 0], [3, 0], [2, 0], [1, 0]])),
  ],
};

export const stringSkippingOpenStringsExercise: Exercise = {
  id: "string_skipping_open_strings",
  addedAt: ADDED,
  title: "String Skipping — Open Strings",
  description:
    "Jump over a string with the pick: low E to D, A to G, D to B, G to high E — open strings only.",
  whyItMatters:
    "Melodies and riffs do not always move to the string next door. Skipping one cleanly, without brushing the string in between, is a picking-hand skill worth meeting early, before bad habits set in.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play one note per click, alternating between two strings with one string between them.",
    "Each bar moves the pair one string higher.",
    "The string in the middle must stay silent.",
    "Use a downstroke on the lower string and an upstroke on the higher one.",
  ],
  tips: [
    "Lift the pick just enough to clear the skipped string — a big arc makes you late.",
    "If the middle string rings, touch it lightly with a fretting-hand finger.",
    "Keep your eyes on the fretboard, not the pick, and let the hand learn the jump.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["string_skipping", "alternate_picking"],
  tablature: [
    bar(quarters([[6, 0], [4, 0], [6, 0], [4, 0]])),
    bar(quarters([[5, 0], [3, 0], [5, 0], [3, 0]])),
    bar(quarters([[4, 0], [2, 0], [4, 0], [2, 0]])),
    bar(quarters([[3, 0], [1, 0], [3, 0], [1, 0]])),
  ],
};

// ── Legato ───────────────────────────────────────────────────────────────────

const hammer = (string: number, duration: number): TablatureBeat[] => [
  beat(duration, note(string, 5)),
  beat(duration, note(string, 7, { isHammerOn: true })),
];

export const hammerOnFirstHammerExercise: Exercise = {
  id: "hammer_on_first_hammer",
  addedAt: ADDED,
  title: "Hammer-Ons — First Hammer",
  description:
    "Pick one note, then sound the next by hammering a finger onto the string — fret 5 to fret 7, on three strings.",
  whyItMatters:
    "A hammer-on gives you two notes for one pick stroke, and it is the first step towards smooth, fast, connected playing. It also builds finger strength more directly than anything else a beginner can practise.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Hold fret 5 with your index finger and pick the string.",
    "Without picking again, bring your ring finger down hard on fret 7 — like a small hammer.",
    "Keep the index finger down the whole time.",
    "Bars 1–3: G, D and A strings in quarter notes. Bar 4: the G string in eighth notes.",
  ],
  tips: [
    "Hit with the fingertip, right behind the fret. Speed matters more than force.",
    "The hammered note should be as loud as the picked one — that is the goal.",
    "If the second note is weak, lift the finger a little higher before it comes down.",
  ],
  metronomeSpeed: { min: 40, max: 110, recommended: 60 },
  relatedSkills: ["legato", "finger_independence"],
  tablature: [
    bar([...hammer(3, 1), ...hammer(3, 1)]),
    bar([...hammer(4, 1), ...hammer(4, 1)]),
    bar([...hammer(5, 1), ...hammer(5, 1)]),
    bar([
      ...hammer(3, 0.5),
      ...hammer(3, 0.5),
      ...hammer(3, 0.5),
      beat(1, note(3, 5)),
    ]),
  ],
};

const pull = (string: number, duration: number): TablatureBeat[] => [
  beat(duration, note(string, 7)),
  beat(duration, note(string, 5, { isPullOff: true })),
];

export const pullOffFirstPullExercise: Exercise = {
  id: "pull_off_first_pull",
  addedAt: ADDED,
  title: "Pull-Offs — First Pull-Off",
  description:
    "Pick fret 7, then pluck the string with the fretting finger as it leaves, sounding fret 5 underneath — on three strings.",
  whyItMatters:
    "The pull-off is the hammer-on in reverse, and the two together are what legato playing is made of. It teaches the fretting hand to make sound on its own, which is a new idea for most beginners.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Place both fingers first: index on fret 5, ring finger on fret 7.",
    "Pick the string, then pull the ring finger off sideways, towards the floor, so it plucks the string.",
    "The index finger stays pressed down and its note rings out.",
    "Bars 1–3: G, D and A strings in quarter notes. Bar 4: the G string in eighth notes.",
  ],
  tips: [
    "Do not just lift the finger — flick it off, or the second note will be silent.",
    "Press the index finger a little harder than usual so the string does not move with the pull.",
    "Mute the neighbouring string with the index finger, in case the flick catches it.",
  ],
  metronomeSpeed: { min: 40, max: 110, recommended: 60 },
  relatedSkills: ["legato", "finger_independence"],
  tablature: [
    bar([...pull(3, 1), ...pull(3, 1)]),
    bar([...pull(4, 1), ...pull(4, 1)]),
    bar([...pull(5, 1), ...pull(5, 1)]),
    bar([
      ...pull(3, 0.5),
      ...pull(3, 0.5),
      ...pull(3, 0.5),
      beat(1, note(3, 7)),
    ]),
  ],
};

// ── Tapping ──────────────────────────────────────────────────────────────────

const tapToOpen = (fret: number): TablatureBeat[] => [
  beat(1, note(3, fret, { isTap: true })),
  beat(1, note(3, 0, { isPullOff: true })),
];

export const tappingFirstTapExercise: Exercise = {
  id: "tapping_first_tap",
  addedAt: ADDED,
  title: "Tapping — First Tap",
  description:
    "Tap a note with a picking-hand finger, then pull off to the open G string. Two notes, no pick.",
  whyItMatters:
    "Tapping looks advanced, but the basic move is a hammer-on and a pull-off done with the other hand. Trying it against an open string, with nothing for the fretting hand to do, shows how simple the motion really is.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Bring the middle or index finger of your picking hand over the fretboard.",
    "Tap it firmly onto the G string at the fret shown — the note sounds without picking.",
    "Pull the finger off sideways so it plucks the open G string.",
    "Bar 1: fret 12. Bar 2: fret 7. Bar 3: fret 5. Bar 4: frets 12 and 7.",
  ],
  tips: [
    "Tap right behind the fret wire, with the tip of the finger.",
    "Rest the fretting hand lightly across the other strings so they stay quiet.",
    "Anchor the picking-hand thumb on the top edge of the neck for accuracy.",
  ],
  metronomeSpeed: { min: 40, max: 110, recommended: 60 },
  relatedSkills: ["tapping", "legato"],
  tablature: [
    bar([...tapToOpen(12), ...tapToOpen(12)]),
    bar([...tapToOpen(7), ...tapToOpen(7)]),
    bar([...tapToOpen(5), ...tapToOpen(5)]),
    bar([...tapToOpen(12), ...tapToOpen(7)]),
  ],
};

// ── Expression ───────────────────────────────────────────────────────────────

const plain = (string: number, fret: number, duration: number) =>
  beat(duration, note(string, fret));
const wobble = (string: number, fret: number, duration: number) =>
  beat(duration, note(string, fret, { isVibrato: true }));

export const vibratoFirstWobbleExercise: Exercise = {
  id: "vibrato_first_wobble",
  addedAt: ADDED,
  title: "Vibrato — First Wobble",
  description:
    "Hold a note still, then hold it again with vibrato — a slow, even push and release of the string.",
  whyItMatters:
    "Vibrato is what makes a held note sound alive, and it is the most personal part of anyone's playing. Comparing the same note with and without it is the clearest way to hear what the movement adds.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Bars 1–2: play each note twice — first held completely still, then with vibrato.",
    "For vibrato, push the string slightly towards the ceiling and let it come back, again and again, in a steady rhythm.",
    "Use the ring finger on the note, with the middle and index fingers behind it for support.",
    "Bars 3–4: one long note per bar, with vibrato from start to finish.",
  ],
  tips: [
    "Turn the wrist, like turning a door knob — do not wiggle the finger alone.",
    "Hook the thumb over the top of the neck for leverage.",
    "Slow and even beats fast and nervous. Try matching the wobble to the click.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["vibrato", "phrasing"],
  tablature: [
    bar([plain(3, 7, 2), wobble(3, 7, 2)]),
    bar([plain(2, 8, 2), wobble(2, 8, 2)]),
    bar([wobble(3, 7, 4)]),
    bar([wobble(2, 8, 4)]),
  ],
};

const long = (fret: number) => beat(1, note(4, fret));
const short = (fret: number) => beat(1, note(4, fret, { isStaccato: true }));

export const articulationShortAndLongExercise: Exercise = {
  id: "articulation_short_and_long",
  addedAt: ADDED,
  title: "Articulation — Short and Long Notes",
  description:
    "The same notes played two ways: held for the whole beat, then cut short — and finally mixed in one bar.",
  whyItMatters:
    "How long a note lasts changes its character as much as which note it is. Choosing the length on purpose, instead of letting notes end wherever they happen to, is the first step from playing notes to playing music.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Bar 1: hold every note until the next one starts.",
    "Bar 2: cut every note short by relaxing the fretting finger right after you pick — keep touching the string.",
    "Bar 3: alternate long and short.",
    "Bar 4: two short notes, then one long note held for two beats.",
  ],
  tips: [
    "Short does not mean quiet. Pick just as firmly and stop the note cleanly.",
    "Keep the finger resting on the string after a short note, so no open string sneaks in.",
    "Listen to the silence after a short note — it should be completely clean.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 70 },
  relatedSkills: ["articulation", "rhythm"],
  tablature: [
    bar([long(5), long(7), long(5), long(7)]),
    bar([short(5), short(7), short(5), short(7)]),
    bar([long(5), short(7), long(5), short(7)]),
    bar([short(7), short(7), beat(2, note(4, 5))]),
  ],
};

// ── Scales ───────────────────────────────────────────────────────────────────

const E_MINOR_PENTATONIC: [number, number][] = [
  [6, 0], [6, 3],
  [5, 0], [5, 2],
  [4, 0], [4, 2],
  [3, 0], [3, 2],
  [2, 0], [2, 3],
  [1, 0], [1, 3],
];
const E_PENTATONIC_DOWN = [...E_MINOR_PENTATONIC].reverse();

export const minorPentatonicOpenPositionExercise: Exercise = {
  id: "minor_pentatonic_open_position_e",
  addedAt: ADDED,
  title: "Minor Pentatonic — Open Position E",
  description:
    "The E minor pentatonic scale using open strings: two notes on every string, one of them always open.",
  whyItMatters:
    "This is the easiest scale on the guitar and the one behind a huge share of rock and blues riffs. Half of its notes need no fretting at all, so you can concentrate on moving from string to string in time.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Every string has two notes: the open string, then a fretted note on fret 2 or 3.",
    "Use the middle finger for fret 2 and the ring finger for fret 3.",
    "Bars 1–3 climb from the low E string to the high E string, one note per click.",
    "Bars 4–6 come back down the same way.",
  ],
  tips: [
    "Notice the pattern of frets: 3, 2, 2, 2, 3, 3 from the low string up.",
    "Alternate the pick: down, up, down, up.",
    "Once you know it, make up a three-note riff on the two lowest strings.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["scales", "alternate_picking"],
  tablature: [
    bar(quarters(E_MINOR_PENTATONIC.slice(0, 4))),
    bar(quarters(E_MINOR_PENTATONIC.slice(4, 8))),
    bar(quarters(E_MINOR_PENTATONIC.slice(8))),
    bar(quarters(E_PENTATONIC_DOWN.slice(0, 4))),
    bar(quarters(E_PENTATONIC_DOWN.slice(4, 8))),
    bar(quarters(E_PENTATONIC_DOWN.slice(8))),
  ],
};
