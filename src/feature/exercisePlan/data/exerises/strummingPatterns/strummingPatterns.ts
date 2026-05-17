import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// ─── Shorthand ────────────────────────────────────────────────────────────────
const D = { direction: "down" as const };
const U = { direction: "up" as const };
const M = { direction: "miss" as const };
const DA = { direction: "down" as const, accented: true };

const TS: [number, number] = [4, 4];
const BASE_TIPS = [
  "Maintain a continuous 8th-note pendulum motion with your strumming arm, ensuring the arm swings even during silent beats.",
  "Start at a slow tempo (e.g., 60 BPM) and increase speed only when the coordination is precise.",
  "Count the subdivisions aloud ('1 & 2 & 3 & 4 &') to lock your physical movement to the internal rhythm.",
];

// ─── Patterns ─────────────────────────────────────────────────────────────────

export const strummingPattern2: Exercise = {
  id: "strumming_pattern_2",
  title: "Strumming Pattern 2 — Quarter Downs + Final Up",
  description: "Execute four steady downstrokes with a single upstroke on the final subdivision.",
  whyItMatters: "This pattern introduces basic subdivision control, allowing you to insert an upstroke without disrupting the primary downbeat pulse.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Strum downward on every quarter-note beat (1, 2, 3, 4).",
    "Add a single upstroke on the final '&' of beat 4.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,D,M,D,U] }],
};

export const strummingPattern3: Exercise = {
  id: "strumming_pattern_3",
  title: "Strumming Pattern 3 — All Eighth Notes",
  description: "Execute continuous alternate strumming on every 8th-note subdivision.",
  whyItMatters: "This pattern establishes the core mechanics of alternate strumming, ensuring equal weight and timing between downstrokes and upstrokes.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 65 },
  instructions: [
    "Strum downward on every beat (1, 2, 3, 4) and upward on every '&'.",
    "Ensure all eight subdivisions sound with consistent volume and clarity.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,U,D,U] }],
};

export const strummingPattern4: Exercise = {
  id: "strumming_pattern_4",
  title: "Strumming Pattern 4 — Down-Skip-Down-Up",
  description: "Perform an alternating pattern with a missed upstroke on the first subdivision.",
  whyItMatters: "This introduces syncopation by omitting a subdivision, training your arm to maintain the pendulum motion even when skipping the strings.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Up, Down, Miss, Down, Up.",
    "Allow the arm to swing upward without striking the strings on the first '&'.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,M,D,U] }],
};

export const strummingPattern5: Exercise = {
  id: "strumming_pattern_5",
  title: "Strumming Pattern 5 — Down-Up Skip",
  description: "Perform a pattern that omits the upstrokes before beats 2 and 4.",
  whyItMatters: "Omitting specific upstrokes develops selective targeting, allowing you to create breathing room within a rhythm without losing momentum.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Miss, Down, Up, Down, Miss.",
    "Maintain the continuous pendulum motion through the omitted upstrokes.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,M,D,U,D,M] }],
};

export const strummingPattern6: Exercise = {
  id: "strumming_pattern_6",
  title: "Strumming Pattern 6 — Syncopated Upstroke",
  description: "Execute a syncopated pattern featuring two consecutive sounding upstrokes.",
  whyItMatters: "Consecutive upstrokes force you to rely entirely on the internal pendulum pulse, developing advanced syncopation and timing independence.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Up, Miss, Up, Down, Miss.",
    "Ensure the upstrokes on '&2' and '&3' ring clearly while the downstroke on beat 3 is a silent swing.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,M,U,D,M] }],
};

export const strummingPattern7: Exercise = {
  id: "strumming_pattern_7",
  title: "Strumming Pattern 7 — Inside Upstrokes",
  description: "Perform a pattern centered around upstrokes on the subdivisions.",
  whyItMatters: "By isolating the upstrokes, this exercise balances your strumming attack and ensures your upward motions are as authoritative as your downward motions.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Up, Miss, Up, Down, Up, Miss, Up.",
    "Execute silent downswings on beats 2 and 4 while letting the surrounding upstrokes ring.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,D,U,M,U] }],
};

export const strummingPattern8: Exercise = {
  id: "strumming_pattern_8",
  title: "Strumming Pattern 8 — Two Downs then Down-Up",
  description: "Combine quarter-note and eighth-note feels within a single measure.",
  whyItMatters: "Mixing rhythmic densities trains your hand to transition smoothly between sparse and busy strumming without altering your core tempo.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Miss, Down, Up, Down, Up.",
    "Keep the downstroke velocity consistent as the pattern transitions from quarter notes to eighth notes.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,D,U,D,U] }],
};

export const strummingPattern9: Exercise = {
  id: "strumming_pattern_9",
  title: "Strumming Pattern 9 — Skip First &",
  description: "Execute an eighth-note run that omits only the first upstroke.",
  whyItMatters: "This pattern builds stamina and consistency in continuous eighth-note strumming, using a single rest to reset the phrasing loop.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Up, Down, Up, Down, Up.",
    "After the initial missed upstroke, maintain an unbroken chain of alternating strums.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,U,D,U] }],
};

export const strummingPattern10: Exercise = {
  id: "strumming_pattern_10",
  title: "Strumming Pattern 10 — Syncopated Upstroke Run",
  description: "Execute a highly syncopated pattern dominated by consecutive upstrokes.",
  whyItMatters: "Extended runs of upstrokes test your timing accuracy and arm control, ensuring your silent downswings remain perfectly anchored to the beat.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Up, Miss, Miss, Up, Miss, Up, Miss.",
    "After beat 1, all subsequent sounding strums are upstrokes on the subdivisions.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,M,U,M,U,M] }],
};

export const strummingPattern11: Exercise = {
  id: "strumming_pattern_11",
  title: "Strumming Pattern 11 — Syncopated Mid-Bar Down",
  description: "Perform a syncopated pattern that interrupts an upstroke run with a mid-measure downstroke.",
  whyItMatters: "Inserting a surprise downstroke into a syncopated run trains rapid motor switching and breaks predictability in your rhythm playing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Up, Miss, Up, Miss, Down, Up, Miss.",
    "Focus on the precise timing of the downstroke on the '&' of beat 3.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,M,D,U,M] }],
};

export const strummingPattern12: Exercise = {
  id: "strumming_pattern_12",
  title: "Strumming Pattern 12 — Starts on Upstroke",
  description: "Begin a strumming sequence on the first subdivision upstroke rather than the downbeat.",
  whyItMatters: "Starting on an upbeat forces you to internalize the downbeat silently, dramatically improving your internal pulse and metronome alignment.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Up, Down, Up, Miss, Up.",
    "Execute a silent downswing on beat 1 before striking the strings on the first upstroke.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,D,U,M,U] }],
};

export const strummingPattern13: Exercise = {
  id: "strumming_pattern_13",
  title: "Strumming Pattern 13 — Soft Landing",
  description: "Perform a steady downstroke sequence featuring a single isolated upstroke.",
  whyItMatters: "This exercise isolates the upstroke motion within a downstroke-heavy context, refining your dynamic control and subtle accenting.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 75 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Up, Down, Miss, Down, Miss.",
    "Ensure the single upstroke on the '&' of beat 2 blends seamlessly with the surrounding downstrokes.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,M,D,M] }],
};

export const strummingPattern14: Exercise = {
  id: "strumming_pattern_14",
  title: "Strumming Pattern 14 — All Upstrokes",
  description: "Execute a pattern composed entirely of upstrokes on the subdivisions.",
  whyItMatters: "Isolating upstrokes builds tone consistency and precise pick depth control, as upward strums are naturally weaker and require focused mechanics.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Miss, Up, Miss, Up, Miss, Up, Miss, Up.",
    "Execute a silent downswing on every beat and a sounding upstroke on every subdivision.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,M,U,M,U,M,U] }],
};

export const strummingPattern15: Exercise = {
  id: "strumming_pattern_15",
  title: "Strumming Pattern 15 — Upstrokes + One Down",
  description: "Perform an upstroke-heavy pattern punctuated by a single downstroke.",
  whyItMatters: "This inversion of standard strumming conventions sharpens your coordination and forces you to treat upstrokes as the primary rhythmic driver.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Miss, Up, Miss, Up, Miss, Down, Up, Miss.",
    "Maintain the upstroke sequence and deliver a controlled downstroke on the '&' of beat 3.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,M,U,M,D,U,M] }],
};

export const strummingPattern16: Exercise = {
  id: "strumming_pattern_16",
  title: "Strumming Pattern 16 — Double Down-Up",
  description: "Execute two alternating pairs embedded within syncopated upstrokes.",
  whyItMatters: "Navigating dense alternating pairs surrounded by silence and syncopation challenges your rhythmic stability and strict pendulum mechanics.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Up, Miss, Up, Down, Up.",
    "Execute silent downswings on beats 1 and 3, allowing the down-up pairs to fall on the subdivisions.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,M,U,D,U] }],
};

export const strummingPattern18: Exercise = {
  id: "strumming_pattern_18",
  title: "Strumming Pattern 18 — Half-Time Feel",
  description: "Perform a sparse pattern with downstrokes on beats 1 and 3.",
  whyItMatters: "Sparse patterns require intense internal counting to prevent rushing. This exercise builds patience and sustained tempo control.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 80 },
  instructions: [
    "Strum the pattern: Down, Miss, Miss, Miss, Down, Miss, Miss, Miss.",
    "Strike only on beats 1 and 3, maintaining the pendulum motion through the extended silences.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,M,M,D,M,M,M] }],
};

export const strummingPattern19: Exercise = {
  id: "strumming_pattern_19",
  title: "Strumming Pattern 19 — Down-Up on Beat 1",
  description: "Begin with an alternating pair followed by strict downstrokes.",
  whyItMatters: "Transitioning immediately from subdivisions to quarter notes stabilizes your tempo and prevents rushing after busy rhythmic figures.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Miss, Down, Miss, Down, Miss.",
    "Ensure the transition from the opening upstroke back to the downbeat is smooth and rhythmically locked.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,M,D,M,D,M] }],
};

export const strummingPattern20: Exercise = {
  id: "strumming_pattern_20",
  title: "Strumming Pattern 20 — Mixed Syncopation",
  description: "Perform a flowing pattern that mixes alternating pairs with isolated downstrokes.",
  whyItMatters: "This develops rhythmic vocabulary by combining common structural building blocks into a cohesive, musical phrase.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Miss, Up, Down, Miss, Down, Up.",
    "Navigate the syncopated upstroke on '&2' cleanly into the downbeat of 3.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,D,M,D,U] }],
};

export const strummingPattern21: Exercise = {
  id: "strumming_pattern_21",
  title: "Strumming Pattern 21 — Upstroke Ending",
  description: "Execute a sparse opening leading into a dense, syncopated ending.",
  whyItMatters: "Managing long silences followed by rapid subdivisions builds dynamic pacing and prevents tempo drag during rests.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Miss, Miss, Miss, Up, Down, Up, Miss.",
    "Maintain steady time after the opening downstroke to ensure the syncopated run lands precisely on the subdivisions.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,M,M,U,D,U,M] }],
};

export const strummingPattern22: Exercise = {
  id: "strumming_pattern_22",
  title: "Strumming Pattern 22 — Mid-Bar Upstroke",
  description: "Perform a pattern featuring an alternating pair displaced to the middle of the measure.",
  whyItMatters: "Displacing standard rhythmic figures to unexpected beats trains your concentration and disrupts automatic muscle memory patterns.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Up, Down, Miss, Down, Miss, Miss.",
    "Focus on the precise timing of the up-down sequence on the '&' of beat 2.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,U,D,M,D,M,M] }],
};

export const strummingPattern23: Exercise = {
  id: "strumming_pattern_23",
  title: "Strumming Pattern 23 — Full 1-2, Quarter 3-4",
  description: "Contrast dense eighth notes in the first half with sparse quarter notes in the second.",
  whyItMatters: "This structural contrast requires you to rapidly shift rhythmic gears without losing the underlying quarter-note pulse.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Up, Down, Miss, Down, Miss.",
    "Keep your strumming velocity consistent as the rhythmic density changes midway through the measure.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,M,D,M] }],
};

export const strummingPattern24: Exercise = {
  id: "strumming_pattern_24",
  title: "Strumming Pattern 24 — Opens on Upstroke",
  description: "Begin on the first subdivision upstroke followed by steady quarter-note downstrokes.",
  whyItMatters: "Starting off-beat before settling into a strong downbeat groove trains recovery mechanics and subdivision awareness.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Miss, Down, Miss, Down, Miss.",
    "Ensure the silent downswing on beat 1 is fully completed before striking the upstroke.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,D,M,D,M] }],
};

export const strummingPattern25: Exercise = {
  id: "strumming_pattern_25",
  title: "Strumming Pattern 25 — Late Upstroke",
  description: "Execute alternating pairs with a syncopated, delayed final upstroke.",
  whyItMatters: "Delayed accents build tension and release in your rhythm playing, requiring strict adherence to the silent pendulum swings.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Up, Down, Miss, Miss, Up.",
    "Hold the silent swings on the '&' of 3 and beat 4 to maximize the impact of the final upstroke.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,M,M,U] }],
};

export const strummingPattern26: Exercise = {
  id: "strumming_pattern_26",
  title: "Strumming Pattern 26 — Two Down-Up Groups",
  description: "Perform two isolated alternating pairs separated by rests.",
  whyItMatters: "Isolating short rhythmic bursts trains explosive control and immediate muting awareness between active strumming phrases.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Miss, Miss, Down, Up, Miss, Miss.",
    "Accent the initial downstroke of each pair while allowing the chord to ring clearly through the rests.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,M,D,U,M,M] }],
};

export const strummingPattern27: Exercise = {
  id: "strumming_pattern_27",
  title: "Strumming Pattern 27 — Upstroke Lead-In",
  description: "Begin with an upstroke leading directly into a continuous eighth-note run.",
  whyItMatters: "Entering a busy pattern on an upstroke requires excellent pick depth control to prevent the pick from digging in and disrupting the flow.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Up, Down, Up, Down, Up.",
    "Keep the initial upstroke light to smoothly transition into the continuous alternating run.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,D,U,D,U] }],
};

export const strummingPattern28: Exercise = {
  id: "strumming_pattern_28",
  title: "Strumming Pattern 28 — Upstroke into Downs",
  description: "Perform an upstroke entry followed by quarter notes and an alternating finish.",
  whyItMatters: "This pattern demands precise switching between off-beats, on-beats, and continuous subdivisions, challenging overall rhythmic agility.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Miss, Down, Miss, Down, Up.",
    "Maintain the core tempo during the transition from the sparse middle section to the busy ending.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,D,M,D,U] }],
};

export const strummingPattern29: Exercise = {
  id: "strumming_pattern_29",
  title: "Strumming Pattern 29 — Skip the & of 3",
  description: "Execute continuous subdivisions with a single omission on the upstroke of beat 3.",
  whyItMatters: "Omitting a single subdivision within a continuous flow develops selective string avoidance and subtle syncopation mechanics.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Up, Miss, Up, Down, Up.",
    "Focus on the silent downswing on beat 3, allowing the surrounding upstrokes to carry the rhythm.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,M,U,D,U] }],
};

export const strummingPattern30: Exercise = {
  id: "strumming_pattern_30",
  title: "Strumming Pattern 30 — Opens Slow, Ends Fast",
  description: "Transition from sparse quarter notes to a dense, syncopated ending phrase.",
  whyItMatters: "Accelerating the rhythmic density builds momentum and phrasing awareness, essential for creating dynamic rhythm guitar parts.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Miss, Down, Miss, Miss, Up, Down, Up.",
    "Use the silence on beat 3 to prepare for the rapid syncopated run at the end of the measure.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,M,U,D,U] }],
};

export const strummingPattern31: Exercise = {
  id: "strumming_pattern_31",
  title: "Strumming Pattern 31 — All Eighths, Skip Last",
  description: "Perform continuous eighth notes, omitting only the final upstroke.",
  whyItMatters: "Dropping the final subdivision creates a brief resting window, useful for executing complex chord transitions on the subsequent downbeat.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Strum the pattern: Down, Up, Down, Up, Down, Up, Down, Miss.",
    "Maintain consistent strumming velocity until the silent upswing on the final subdivision.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,U,D,M] }],
};

export const strummingPattern32: Exercise = {
  id: "strumming_pattern_32",
  title: "Strumming Pattern 32 — Double Upstroke Gaps",
  description: "Execute isolated up-down pairs positioned exclusively on subdivisions.",
  whyItMatters: "This highly syncopated pattern entirely avoids the strong downbeats, forcing complete reliance on internal timing and subdivision accuracy.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 95, recommended: 60 },
  instructions: [
    "Strum the pattern: Miss, Up, Down, Miss, Miss, Up, Down, Miss.",
    "Execute silent downswings on beats 1 and 3, ensuring the up-down pairs fall precisely off the beat.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,M,U,D,M] }],
};
