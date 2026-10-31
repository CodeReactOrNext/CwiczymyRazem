/**
 * How an AI client writes a riff.quest tab. Served by the `get_tab_format`
 * tool and the `riffquest://docs/tab-format` resource, so a client without
 * skills gets the same guide the riff-quest-tabs skill points to.
 *
 * Every rule here is one validateTablature enforces — change them together.
 */
export const TAB_FORMAT_GUIDE = `# riff.quest tab format

A tab is a JSON array of measures. The app renders it as tab + standard notation,
plays it, and scores the player's notes through the microphone against it.

## Shape

\`\`\`
measure = { timeSignature: [beats, noteValue], beats: beat[] }
beat    = { duration: number, notes: note[], tuplet?: 3|5|6|7|9|10|11|12, pickStroke?: "down"|"up", chordName?: string }
note    = { string: 1-6, fret: 0-24, ...techniques }
\`\`\`

## The four rules that matter

1. **string 1 = HIGH e, string 6 = LOW E.** Top line of the tab is string 1.
2. **duration is in quarter notes:** whole 4, half 2, quarter 1, eighth 0.5,
   sixteenth 0.25, thirty-second 0.125. Dotted: 3, 1.5, 0.75, 0.375.
3. **Every measure must add up exactly:** sum of durations = beats × 4 / noteValue.
   4/4 → 4, 3/4 → 3, 6/8 → 3, 12/8 → 6, 7/8 → 3.5.
4. **Rest = a beat with \`notes: []\`.** A chord = several notes in one beat, one per string.

## Tuplets

\`duration\` is the *sounding* length. Triplet eighths: \`duration: 1/3\` (0.3333) with
\`tuplet: 3\` — three of them fill one quarter. Triplet sixteenths: \`1/6\` with \`tuplet: 3\`.
Sextuplet sixteenths: \`1/6\` with \`tuplet: 6\`. Quintuplet sixteenths: \`0.2\` with \`tuplet: 5\`.

## Techniques (all optional, on the note)

- \`isHammerOn\` / \`isPullOff\` — on the note you ARRIVE at, not the picked one.
  5 → 7 hammer-on: the 7 has \`isHammerOn: true\`. Same string, the previous note is the origin.
- \`isBend\` + \`bendSemitones\` (1 = half step, 2 = whole step). \`isPreBend\`, \`isRelease\`.
- \`isVibrato\`, \`isPalmMute\`, \`isLetRing\`, \`isStaccato\`, \`isAccented\`, \`isGhost\`,
  \`isDead\` (muted X), \`isTap\`.
- \`slideIn\` 1 = from below, 2 = from above. \`slideOut\` 1 = shift, 2 = legato slide.
- \`harmonicType\` 1 natural, 2 artificial, 3 tapped, 4 pinch, 5 semi.
- On the beat: \`pickStroke: "down" | "up"\` for picking direction.

## Good exercises

- Short loop: 1–4 measures the player repeats. At most 64 measures.
- One idea per exercise (a picking pattern, a legato shape, a chord change).
- Give a BPM range: \`min\` comfortable, \`max\` the goal, \`recommended\` in between.
- 2–5 instructions (what to do) and 1–3 tips (what to listen for).
- Pick 1–3 skill ids from list_exercise_taxonomy.

## Example: one 4/4 bar of alternate-picked sixteenths with a hammer-on bar after it

\`\`\`json
[
  { "timeSignature": [4, 4], "beats": [
    { "duration": 0.25, "pickStroke": "down", "notes": [{ "string": 3, "fret": 5 }] },
    { "duration": 0.25, "pickStroke": "up",   "notes": [{ "string": 3, "fret": 7 }] },
    { "duration": 0.25, "pickStroke": "down", "notes": [{ "string": 2, "fret": 5 }] },
    { "duration": 0.25, "pickStroke": "up",   "notes": [{ "string": 2, "fret": 6 }] },
    { "duration": 1, "notes": [{ "string": 1, "fret": 5 }] },
    { "duration": 1, "notes": [{ "string": 1, "fret": 7, "isHammerOn": true }] },
    { "duration": 1, "notes": [] }
  ]},
  { "timeSignature": [4, 4], "beats": [
    { "duration": 2, "notes": [{ "string": 5, "fret": 3 }, { "string": 4, "fret": 2 }, { "string": 3, "fret": 0 }], "chordName": "C" },
    { "duration": 2, "notes": [{ "string": 2, "fret": 8, "isBend": true, "bendSemitones": 2, "isVibrato": true }] }
  ]}
]
\`\`\`

## Workflow

1. Write the tab, call \`validate_tablature\`, fix every error it lists (it names measure and beat).
2. \`create_exercise\` — saved as the player's private exercise, with a link to play it.
3. After the player tries it, adjust with \`update_exercise\`.
`;
