/**
 * How an AI client writes a riff.quest tab. Served by the `riffquest_get_tab_format`
 * tool and the `riffquest://docs/tab-format` resource, so a client without
 * skills gets the same guide the riff-quest-tabs skill points to.
 *
 * Every rule here is one tabSchema or validateTablature enforces — change
 * them together. The example is tested to pass.
 */
export const TAB_FORMAT_GUIDE = `# riff.quest tab format

A tab is a list of measures; a measure is a list of beats; a beat is one note, a
chord or a rest, with its note value. The app renders it as tab + standard
notation, plays it, and scores the player's notes through the microphone.

The JSON is what the tools exchange. The player sees the same tab as a plain-text
tab — every tool that takes or returns a tab also returns it as \`asciiTab\` — or
as tab and notation in \`riffquest_preview_tab\` and in the app.

## Shape

\`\`\`
tab     = { timeSignature?: "4/4", measures: measure[] }
measure = { timeSignature?: "3/4", beats: beat[] }          — only where it changes
beat    = { duration, dots?, tuplet?, notes? | rest: true, pick?: "down"|"up", chord?: "Am" }
note    = { string, fret, techniques?, bend?, slideIn?, slideOut?, harmonic? }
\`\`\`

## The rules that matter

1. **Strings count from the thin one: string 1 = high e, string 6 = low E.**
   The top line of a tab is string 1.
2. **duration is the written note value:** \`whole\`, \`half\`, \`quarter\`, \`eighth\`,
   \`sixteenth\`, \`thirty-second\`, \`sixty-fourth\`. \`dots: 1\` makes it dotted.
3. **Every measure adds up exactly to its time signature.** 4/4 holds four
   quarters (eight eighths, sixteen sixteenths…); 3/4 three quarters; 6/8 six eighths.
4. **A beat is notes or a rest:** \`notes\` with one note, or a chord with one note
   per string — or \`"rest": true\`.

## Triplets and other tuplets

Write the note value as it's notated and add \`tuplet\`. Three triplet eighths fill
one quarter: three beats of \`{ "duration": "eighth", "tuplet": 3 }\`. Triplet
sixteenths: \`"sixteenth"\` with \`tuplet: 3\`. Also 5, 6, 7 and 9–12.

## Bass

Set \`instrument: "bass"\` on the exercise (and on \`riffquest_validate_tablature\`) for a 4-string
bass in standard tuning. Strings are then **1–4: 1 = G, 2 = D, 3 = A, 4 = low E**.
Everything else works the same. Without \`instrument\` the tab is a guitar tab.

## Techniques

On the note, all optional:

- \`techniques\`: any of \`hammer-on\`, \`pull-off\`, \`tap\`, \`vibrato\`, \`palm-mute\`,
  \`let-ring\`, \`staccato\`, \`accent\`, \`ghost\`, \`dead-note\`.
  **hammer-on and pull-off go on the note you arrive at**, not the picked one:
  5 → 7 hammer-on is a 5, then a 7 with \`hammer-on\`, on the same string.
- \`bend\`: \`{ "semitones": 1 }\` (1 = half step, 2 = whole step); \`"prebent": true\` for
  a pre-bend, \`"release": true\` to let it back down.
- \`slideIn\`: \`from-below\` | \`from-above\`. \`slideOut\`: \`shift\` | \`legato\`.
- \`harmonic\`: \`natural\` | \`artificial\` | \`tapped\` | \`pinch\` | \`semi\`.

On the beat: \`pick: "down" | "up"\` for the picking direction, \`chord: "C"\` for a
chord symbol above the tab.

## Good exercises

- Short loop: 1–4 measures the player repeats. At most 64 measures.
- One idea per exercise (a picking pattern, a legato shape, a chord change).
- Give a BPM range: \`min\` comfortable, \`max\` the goal, \`recommended\` in between.
- 2–5 instructions (what to do) and 1–3 tips (what to listen for).
- Pick 1–3 skill ids from riffquest_list_exercise_taxonomy.

## Example: alternate-picked sixteenths and a hammer-on, then a chord and a bend

\`\`\`json
{
  "timeSignature": "4/4",
  "measures": [
    { "beats": [
      { "duration": "sixteenth", "pick": "down", "notes": [{ "string": 3, "fret": 5 }] },
      { "duration": "sixteenth", "pick": "up",   "notes": [{ "string": 3, "fret": 7 }] },
      { "duration": "sixteenth", "pick": "down", "notes": [{ "string": 2, "fret": 5 }] },
      { "duration": "sixteenth", "pick": "up",   "notes": [{ "string": 2, "fret": 6 }] },
      { "duration": "quarter", "notes": [{ "string": 1, "fret": 5 }] },
      { "duration": "quarter", "notes": [{ "string": 1, "fret": 7, "techniques": ["hammer-on"] }] },
      { "duration": "quarter", "rest": true }
    ]},
    { "beats": [
      { "duration": "half", "chord": "C", "notes": [
        { "string": 5, "fret": 3 }, { "string": 4, "fret": 2 }, { "string": 3, "fret": 0 }
      ]},
      { "duration": "half", "notes": [
        { "string": 2, "fret": 8, "bend": { "semitones": 2 }, "techniques": ["vibrato"] }
      ]}
    ]}
  ]
}
\`\`\`

## Workflow

1. Write the tab, call \`riffquest_validate_tablature\` and fix every error it lists (it names
   the measure and beat).
2. \`riffquest_preview_tab\` shows it as tablature and notation with playback, in clients that
   display MCP Apps; elsewhere \`asciiTab\` is the tab to show.
3. \`riffquest_create_exercise\` saves it as the player's private exercise, with a link to play it.
4. After the player tries it, adjust with \`riffquest_update_exercise\`.
`;
