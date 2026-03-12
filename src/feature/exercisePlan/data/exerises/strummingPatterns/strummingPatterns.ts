import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// ─── Shorthand ────────────────────────────────────────────────────────────────
const D = { direction: "down" as const };
const U = { direction: "up" as const };
const M = { direction: "miss" as const };
const DA = { direction: "down" as const, accented: true };

const TS: [number, number] = [4, 4];
const BASE_TIPS = [
  "Keep your strumming arm moving in a constant 8th-note pendulum — even on 'miss' slots your arm swings through the air.",
  "Start at 60 BPM and only speed up when the pattern feels automatic.",
  "Count aloud: '1 & 2 & 3 & 4 &' while you play.",
];

// ─── Patterns ─────────────────────────────────────────────────────────────────

export const strummingPattern2: Exercise = {
  id: "strumming_pattern_2",
  title: "Strumming Pattern 2 — Quarter Downs + Final Up",
  description: "Four steady downstrokes with a single upstroke on the final '&'. The easiest entry to strumming with rhythm.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Strum down on every beat (1, 2, 3, 4). Add one upstroke on the final '&' of beat 4.",
    "Keep the arm swinging even when you're not hitting the strings.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,D,M,D,U] }],
};

export const strummingPattern3: Exercise = {
  id: "strumming_pattern_3",
  title: "Strumming Pattern 3 — All Eighth Notes",
  description: "Constant down-up strumming on every 8th note subdivision. The foundation of all strumming.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 65 },
  instructions: [
    "Strum down on every beat (1, 2, 3, 4) and up on every '&'.",
    "All 8 strums should sound — keep equal weight on downs and ups.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,U,D,U] }],
};

export const strummingPattern4: Exercise = {
  id: "strumming_pattern_4",
  title: "Strumming Pattern 4 — Down-Skip-Down-Up",
  description: "Down on 1, skip the '&', Down-Up on 2, repeat. One of the most common pop/rock patterns.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↓↑ ↓ _ ↓↑",
    "The skip on the first '&' gives it a slight bounce feel.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,M,D,U] }],
};

export const strummingPattern5: Exercise = {
  id: "strumming_pattern_5",
  title: "Strumming Pattern 5 — Down-Up Skip",
  description: "Down-Up on beats 1 and 3, skip the '&' before beats 2 and 4. Creates a forward-moving feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ ↓ _ ↓↑ ↓ _",
    "The missing '&' before beats 2 and 4 creates a subtle push feeling.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,M,D,U,D,M] }],
};

export const strummingPattern6: Exercise = {
  id: "strumming_pattern_6",
  title: "Strumming Pattern 6 — Syncopated Upstroke",
  description: "Classic syncopated pattern: the '&' of beat 2 continues into beat 3 with two upstrokes.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↓↑ _ ↑ ↓ _",
    "The two consecutive upstrokes (beats '&2' and '&3') is the characteristic feel of this pattern.",
    "Keep the arm moving — the skip on beat 3 is an air swing.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,M,U,D,M] }],
};

export const strummingPattern7: Exercise = {
  id: "strumming_pattern_7",
  title: "Strumming Pattern 7 — Inside Upstrokes",
  description: "Downstrokes on 1 and 3, surrounded by upstrokes on all the '&' positions. Flowing and continuous.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 65 },
  instructions: [
    "Pattern: ↓↑ _ ↑ ↓↑ _ ↑",
    "Beats 2 and 4 are skipped (air swing) but the '&' positions around them still ring out.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,D,U,M,U] }],
};

export const strummingPattern8: Exercise = {
  id: "strumming_pattern_8",
  title: "Strumming Pattern 8 — Two Downs then Down-Up",
  description: "Steady quarter-note feel on beats 1-2, then eighth-note feel on beats 3-4.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↓ _ ↓↑ ↓↑",
    "The second half of the bar feels busier — keep the downstroke weight consistent throughout.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,D,U,D,U] }],
};

export const strummingPattern9: Exercise = {
  id: "strumming_pattern_9",
  title: "Strumming Pattern 9 — Skip First &",
  description: "Skips only the first '&', then runs all eighth notes for the rest of the bar.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↓↑ ↓↑ ↓↑",
    "Only beat 1 is a lone down — everything else is steady eighth notes.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,U,D,U] }],
};

export const strummingPattern10: Exercise = {
  id: "strumming_pattern_10",
  title: "Strumming Pattern 10 — Syncopated Upstroke Run",
  description: "Heavy syncopation: three upstrokes in a row after beat 1. Creates a choppy, modern feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: ↓↑ _ _ ↑ _ ↑ _",
    "After the opening down-up on beat 1, all remaining strums are upstrokes.",
    "Keep the arm moving in constant pendulum — beats 2 and 4 (down swings) pass through air.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,M,U,M,U,M] }],
};

export const strummingPattern11: Exercise = {
  id: "strumming_pattern_11",
  title: "Strumming Pattern 11 — Syncopated Mid-Bar Down",
  description: "Starts with down-up, then a series of upstrokes with a surprise downstroke in the middle.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: ↓↑ _ ↑ _ ↓↑ _",
    "The downstroke on '&' of beat 3 is unexpected — it breaks the upstroke run.",
    "Practice very slowly until the mid-bar down feels natural.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,M,D,U,M] }],
};

export const strummingPattern12: Exercise = {
  id: "strumming_pattern_12",
  title: "Strumming Pattern 12 — Starts on Upstroke",
  description: "Begins with an upstroke on the '&' of beat 1. Unusual feel that trains coordination.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Pattern: _ ↑ ↓↑ ↓↑ _ ↑",
    "The first strum is an upstroke on '&1' — your arm swings DOWN on beat 1 without hitting strings.",
    "Start with a silent downswing, then your first actual strum is up.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,D,U,M,U] }],
};

export const strummingPattern13: Exercise = {
  id: "strumming_pattern_13",
  title: "Strumming Pattern 13 — Soft Landing",
  description: "Down on all 4 beats, with a single upstroke on '&' of beat 2. Gentle and versatile.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 75 },
  instructions: [
    "Pattern: ↓ _ ↓↑ ↓ _ ↓ _",
    "Almost all downstrokes — the upstroke on '&2' adds a small rhythmic lift.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,U,D,M,D,M] }],
};

export const strummingPattern14: Exercise = {
  id: "strumming_pattern_14",
  title: "Strumming Pattern 14 — All Upstrokes",
  description: "Only upstrokes on every '&'. No downstrokes at all. Develops upstroke technique and tone.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: _ ↑ _ ↑ _ ↑ _ ↑",
    "Your arm swings DOWN on every beat (silent) and UP on every '&' (strings ring).",
    "Focus on getting a clean, bright tone on each upstroke.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,M,U,M,U,M,U] }],
};

export const strummingPattern15: Exercise = {
  id: "strumming_pattern_15",
  title: "Strumming Pattern 15 — Upstrokes + One Down",
  description: "Upstrokes on '&' positions with a single downstroke sneaked in. Trains rhythmic variety.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: _ ↑ _ ↑ _ ↓↑ _",
    "Like pattern 14 but with a down-up pair on '&' of beat 3.",
    "The down on beat '&3' stands out — make it slightly louder.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,M,U,M,D,U,M] }],
};

export const strummingPattern16: Exercise = {
  id: "strumming_pattern_16",
  title: "Strumming Pattern 16 — Double Down-Up",
  description: "Two down-up pairs buried inside upstroke-only positions. Tricky syncopation challenge.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Pattern: _ ↑ ↓↑ _ ↑ ↓↑",
    "Beats 1 and 3 are silent downswings. The down-up pairs fall on beats '&1-2' and '&3-4'.",
    "This is an advanced pattern — go very slow first.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,M,U,D,U] }],
};

export const strummingPattern18: Exercise = {
  id: "strumming_pattern_18",
  title: "Strumming Pattern 18 — Half-Time Feel",
  description: "Only downstrokes on beats 1 and 3. Creates a slow, open, spacious feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 80 },
  instructions: [
    "Pattern: ↓ _ _ _ ↓ _ _ _",
    "Only two strums per bar — beats 1 and 3. Listen carefully to chord resonance.",
    "This pattern works great for slow ballads and intro sections.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,M,M,D,M,M,M] }],
};

export const strummingPattern19: Exercise = {
  id: "strumming_pattern_19",
  title: "Strumming Pattern 19 — Down-Up on Beat 1",
  description: "Opens with a down-up pair, then straight downstrokes. Creates an energetic opening feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ ↓ _ ↓ _ ↓ _",
    "The '&1' upstroke gives the bar an energetic kick-start.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,M,D,M,D,M] }],
};

export const strummingPattern20: Exercise = {
  id: "strumming_pattern_20",
  title: "Strumming Pattern 20 — Mixed Syncopation",
  description: "A balanced mix of down-up pairings and single downstrokes creating a flowing rhythm.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ _ ↑ ↓ _ ↓↑",
    "The upstroke on '&2' creates a syncopated forward push into beat 3.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,U,D,M,D,U] }],
};

export const strummingPattern21: Exercise = {
  id: "strumming_pattern_21",
  title: "Strumming Pattern 21 — Upstroke Ending",
  description: "Single downstroke to open, then an upstroke-down-up figure at the end of the bar.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 65 },
  instructions: [
    "Pattern: ↓ _ _ _ ↑ ↓↑ _",
    "Long pause after beat 1 then a quick ↑↓↑ run starting on '&3'. Very syncopated.",
    "The upstroke on beat 3 is unexpected — practice the second half of the bar in isolation first.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,M,M,U,D,U,M] }],
};

export const strummingPattern22: Exercise = {
  id: "strumming_pattern_22",
  title: "Strumming Pattern 22 — Mid-Bar Upstroke",
  description: "Down, then upstroke-down on beat 2, followed by a lone down on beat 3.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↑↓ _ ↓ _ _",
    "The ↑↓ pair on '&2-2' is the tricky part — practice it slowly in isolation.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,U,D,M,D,M,M] }],
};

export const strummingPattern23: Exercise = {
  id: "strumming_pattern_23",
  title: "Strumming Pattern 23 — Full 1-2, Quarter 3-4",
  description: "Eighth notes on beats 1-2, quarter notes on beats 3-4. Contrast between sections.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ ↓↑ ↓ _ ↓ _",
    "The first half is dense, the second half opens up. Feel the contrast.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,M,D,M] }],
};

export const strummingPattern24: Exercise = {
  id: "strumming_pattern_24",
  title: "Strumming Pattern 24 — Opens on Upstroke",
  description: "Starts on an '&1' upstroke, then quarter-note downs. Advanced feel with delayed entry.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 60 },
  instructions: [
    "Pattern: _ ↑ ↓ _ ↓ _ ↓ _",
    "Silent downswing on beat 1, first actual strum is the upstroke on '&1'.",
    "Visualize counting out loud to make the first beat feel natural.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,D,M,D,M] }],
};

export const strummingPattern25: Exercise = {
  id: "strumming_pattern_25",
  title: "Strumming Pattern 25 — Late Upstroke",
  description: "Four beats of down-up but skips the '&' of beats 3 and 4, ending with a final upstroke.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: ↓↑ ↓↑ ↓ _ _ ↑",
    "The gap on '&3' and beat 4 leads into a lone final upstroke — creates anticipation.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,M,M,U] }],
};

export const strummingPattern26: Exercise = {
  id: "strumming_pattern_26",
  title: "Strumming Pattern 26 — Two Down-Up Groups",
  description: "Two isolated down-up pairs, one on beat 1 and one on beat 3. Big open gaps between them.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ _ _ ↓↑ _ _",
    "Lots of silence — let the chord ring out in the gaps.",
    "Accent the downstroke of each pair slightly.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,M,M,D,U,M,M] }],
};

export const strummingPattern27: Exercise = {
  id: "strumming_pattern_27",
  title: "Strumming Pattern 27 — Upstroke Lead-In",
  description: "Upstroke on '&1' followed by constant eighth notes. Creates a forward, driving feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: _ ↑ ↓↑ ↓↑ ↓↑",
    "Silent downswing on beat 1, then five consecutive strums starting with '&1' up.",
    "The upstroke lead-in is tricky — count carefully.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,U,D,U,D,U] }],
};

export const strummingPattern28: Exercise = {
  id: "strumming_pattern_28",
  title: "Strumming Pattern 28 — Upstroke into Downs",
  description: "Upstroke on '&1', then downstrokes on beats 2 and 3, finishing with down-up.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: _ ↑ ↓ _ ↓ _ ↓↑",
    "The upstroke opener followed by quiet quarter-note downs is the challenging transition.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,D,M,D,U] }],
};

export const strummingPattern29: Exercise = {
  id: "strumming_pattern_29",
  title: "Strumming Pattern 29 — Skip the & of 3",
  description: "Constant eighth notes but with a skip on '&' of beat 3. Creates a characteristic 'hiccup'.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 100, recommended: 65 },
  instructions: [
    "Pattern: ↓↑ ↓↑ _ ↑ ↓↑",
    "The missing down on beat 3 lands on an up instead — this syncopation is widely used in pop.",
    "Practice beats 2-3 in isolation: ↓↑ _ ↑",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,M,U,D,U] }],
};

export const strummingPattern30: Exercise = {
  id: "strumming_pattern_30",
  title: "Strumming Pattern 30 — Opens Slow, Ends Fast",
  description: "Two quiet quarter-note downs, then a syncopated upstroke and down-up ending.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  instructions: [
    "Pattern: ↓ _ ↓ _ _ ↑ ↓↑",
    "The '&3' skip creates tension that resolves into the final ↑↓↑ run.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,M,D,M,M,U,D,U] }],
};

export const strummingPattern31: Exercise = {
  id: "strumming_pattern_31",
  title: "Strumming Pattern 31 — All Eighths, Skip Last",
  description: "Continuous eighth notes but the very last '&' is skipped. Almost full but not quite.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 115, recommended: 70 },
  instructions: [
    "Pattern: ↓↑ ↓↑ ↓↑ ↓ _",
    "Seven out of eight strums play — just the final '&4' is silent.",
    "Great for transitioning into a chord change on the next beat 1.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [D,U,D,U,D,U,D,M] }],
};

export const strummingPattern32: Exercise = {
  id: "strumming_pattern_32",
  title: "Strumming Pattern 32 — Double Upstroke Gaps",
  description: "Two up-down pairs on '&' positions, with everything else silent. Very syncopated.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  relatedSkills: ["rhythm"],
  metronomeSpeed: { min: 50, max: 95, recommended: 60 },
  instructions: [
    "Pattern: _ ↑ ↓ _ _ ↑ ↓ _",
    "Only four strums in the whole bar — the silent beats are easy to rush. Use a metronome.",
    "Visualize the full arm pendulum motion to keep the silent beats in time.",
  ],
  tips: BASE_TIPS,
  strummingPatterns: [{ timeSignature: TS, subdivisions: 2, strums: [M,U,D,M,M,U,D,M] }],
};
