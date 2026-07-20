import type { SeoLandingConfig } from "../types/seoLanding.types";

export const guitarScaleRoutineConfig: SeoLandingConfig = {
  slug: "guitar-scale-practice-routine",
  title: "Guitar Scale Practice Routine: How to Practice Scales So They Stick",
  metaTitle: "Guitar Scale Practice Routine (Daily Plan)",
  metaDescription:
    "How to practice guitar scales effectively: which scales to practice daily, pentatonic drills with tabs, and a 15-minute CAGED fretboard-mapping routine.",
  publishedAt: "2026-07-20",
  updatedAt: "2026-07-20",
  intro: [
    "Practicing guitar scales means three things done daily: drilling a position until it is automatic, connecting it to the notes it contains, and immediately using it to make music. Run scales up and down for a year and you will be excellent at running scales up and down — and still lost in a solo.",
    "This routine fixes that. It combines pentatonic drills with interactive tabs, hammer-on and pull-off phrasing work, and a 15-minute daily fretboard-mapping plan built around the CAGED system. Everything here is free to practice with real-time feedback in [Riff Quest](/how-it-works).",
  ],
  sections: [
    {
      heading: "How to Practice Guitar Scales (Not Just Run Them)",
      blocks: [
        {
          kind: "paragraph",
          text: "The mistake almost everyone makes when practicing scales on guitar is treating the pattern as the goal. The pattern is a container; the skill is knowing what is inside it. Four principles turn scale running into scale *learning*:",
        },
        {
          kind: "list",
          items: [
            "**One position at a time.** Master one box until you can play it eyes-closed from any starting note before touching the next. Five half-known boxes are worth less than one owned box.",
            "**Rhythm before range.** Play the scale in triplets, in groups of four, with accents — a scale is only useful at the rhythmic resolution you can control.",
            "**Say the notes.** At least once per session, name each note aloud as you play it. This is what converts a finger pattern into fretboard knowledge.",
            "**Apply within five minutes.** End every scale session by improvising with the same notes over a drone or backing track. Unapplied patterns evaporate.",
          ],
        },
        {
          kind: "tip",
          title: "The 80/20 of scale practice",
          text: "If you only have ten minutes: five minutes of one box with a metronome, five minutes of improvising inside that box over a backing track. That loop, done daily, outperforms any amount of pattern marathons.",
        },
      ],
    },
    {
      heading: "Which Scales to Practice Daily (and in What Order)",
      blocks: [
        {
          kind: "paragraph",
          text: "You do not need many scales — you need the right ones in the right order. This is the sequence that covers the overwhelming majority of Western music, and each step builds directly on the previous one:",
        },
        {
          kind: "list",
          items: [
            "**Minor pentatonic** — five notes, the backbone of rock, blues and metal soloing. Start here, box 1, key of A.",
            "**Major scale** — the reference system all theory hangs on. Learn it as a sound first, pattern second.",
            "**Major pentatonic** — the same shapes as minor pentatonic starting elsewhere; instant country/pop/blues brightness.",
            "**Natural minor** — the pentatonic's two missing notes, unlocking full melodic vocabulary.",
            "**Modes (much later)** — only once the major scale is genuinely mapped. Modes are ways of *hearing*, not new patterns to run.",
          ],
        },
        {
          kind: "paragraph",
          text: "Daily practice touches one 'main' scale (the one you are currently mapping) plus a quick maintenance pass of the previous one. Rotating five scales daily is how you stay busy without improving.",
        },
      ],
    },
    {
      heading: "Pentatonic Foundation Drills",
      blocks: [
        {
          kind: "paragraph",
          text: "Three drills, in strict order: learn the box, survive the string crossings, then discipline the picking. Together they take the A minor pentatonic from 'shape I saw once' to 'shape my hands own'.",
        },
        {
          kind: "exercise",
          exerciseId: "pentatonic_box1_up_down",
          commentary: [
            "Box 1, ascending and descending, two notes per string. The trap in this friendly shape is fingering inconsistency — using whatever finger lands first. Fix the fingering (index + ring or index + pinky per the tab) and never deviate; improvisation later depends on the hand knowing exactly where it is without looking.",
            "When it is comfortable, play it in triplets and in groups of four. Same notes, new rhythm — your picking hand will disagree about where the accents fall, and that disagreement is the exercise.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "pentatonic_string_crossing_3",
          commentary: [
            "String crossings are where pentatonic runs stumble: two notes per string means the pick changes strings constantly, alternating between 'outside' and 'inside' crossings. This drill isolates three strings and loops the crossings until they stop being events. If your fast pentatonic runs have a rhythmic hiccup in the middle, it is almost certainly a crossing — this is the medicine.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "alternate_picking_pentatonic_a_positions",
          commentary: [
            "The full position drill with strict alternate picking — no cheating with pull-offs, no convenient double-downstrokes. Strict picking through a pentatonic box is harder than it looks and is exactly the discipline that makes the shape usable at speed. Treat it as a [synchronization exercise](/guitar-speed-hand-synchronization-exercises) wearing a scale costume.",
          ],
        },
      ],
    },
    {
      heading: "Making Scales Musical: Hammer-Ons, Pull-Offs, Phrasing",
      blocks: [
        {
          kind: "paragraph",
          text: "Nobody solos in strict alternate-picked scale runs. Real lines flow through hammer-ons and pull-offs, breathe in phrases, and land on chord tones. These two runs convert your box knowledge into vocabulary.",
        },
        {
          kind: "exercise",
          exerciseId: "hammer_on_pentatonic_run",
          commentary: [
            "An ascending three-string pentatonic run built on hammer-ons: pick the first note of each string, hammer the second. Instantly more vocal than picking everything — and instantly revealing: hammered notes that come out quieter than picked ones tell you the fretting hand has been coasting. Equal volume across all notes is the target.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "pull_off_pentatonic_run",
          commentary: [
            "The descending mirror — a dark, cascading pull-off run. Pull-offs fail differently than hammer-ons: the finger must *flick* slightly sideways as it releases, actively plucking the string, or the note dies. Master both runs and you can sustain fluid lines in either direction while barely picking — which is how fast pentatonic playing actually works.",
          ],
        },
      ],
    },
    {
      heading: "CAGED Fretboard Mapping: a 15-Minute Daily Plan",
      blocks: [
        {
          kind: "paragraph",
          text: "The CAGED system maps the fretboard as five overlapping chord shapes (C-A-G-E-D), each anchoring a scale position. Its real value is not the shapes — it is that every scale position becomes attached to a chord you can *see*, so 'where am I?' always has an answer. Here is a 15-minute daily practice plan that installs the map one region at a time:",
        },
        {
          kind: "schedule",
          schedule: {
            title: "15-minute daily fretboard mapping routine",
            columns: ["Minutes", "Focus", "What to do"],
            rows: [
              [
                "0–3",
                "Note hunt",
                "[Find every instance](#random-note-hunt) of one note (this week's target) across the neck, saying the string and fret aloud.",
              ],
              [
                "3–8",
                "Position drill",
                "This week's scale position with a metronome — [box 1](#pentatonic-box1-up-down) or the [configurable scale drill](#scale-practice-configurable) set to your current CAGED shape.",
              ],
              [
                "8–11",
                "Connect",
                "Play the same lick in the current position and the neighboring one; cross the seam between them until it feels like one region.",
              ],
              [
                "11–15",
                "Apply",
                "Improvise over a backing track using only this position — chord tones on strong beats, everything else in between.",
              ],
            ],
          },
        },
        {
          kind: "exercise",
          exerciseId: "scale_practice_configurable",
          commentary: [
            "The workhorse for the position-drill block: pick any scale, any key, any position, and the app generates the pattern with an interactive tab and listens as you play it. Change one variable per week — new position, same scale; or same position, new key — so the map grows systematically instead of randomly.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "random_note_hunt",
          commentary: [
            "The note-hunt block, gamified: the app calls out random notes and you find them everywhere on the neck, against the clock. Three minutes daily of this does more for fretboard fluency than any poster of note names ever will — because recall under mild pressure is what playing actually demands.",
          ],
        },
        {
          kind: "cta",
          title: "Run the whole routine inside Riff Quest",
          text: "Interactive tabs for every drill, a metronome, note detection that hears whether you hit the right fret, and a heatmap that shows your daily scale streak. Free, no paywalls.",
        },
      ],
    },
    {
      heading: "From Patterns to Music",
      blocks: [
        {
          kind: "paragraph",
          text: "The routine above makes scales automatic; the last step is making them optional. Set aside one session a week where you ignore positions entirely: pick three notes, improvise with only those; sing a phrase, then find it on the neck; learn a solo you love and notice which scale it *breaks*. Ear-first practice is the difference between playing scales and playing music — our guide to [ear training for guitarists](/blog/best-ear-training-exercises-for-guitarists) is the natural companion here.",
        },
        {
          kind: "paragraph",
          text: "And when scale runs start demanding more speed than your hands deliver, that is a synchronization problem, not a scale problem — the [speed and hand-sync exercises](/guitar-speed-hand-synchronization-exercises) are the fix. For fitting scales into a complete practice day, see the [daily guitar practice plan](/daily-guitar-practice-plan).",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How long should I practice scales each day?",
      answer:
        "Ten to fifteen minutes daily is enough, provided it is structured: a few minutes of position drilling with a metronome, a few minutes of fretboard mapping, and always a few minutes of improvising with the same notes. Beyond twenty minutes, scale practice hits diminishing returns and starts eating time better spent on repertoire and ears.",
    },
    {
      question: "Which scales should I practice daily as a beginner?",
      answer:
        "One: the minor pentatonic, box 1, in A. Add the major scale once you can play box 1 eyes-closed from any starting note and improvise simple phrases inside it. Depth in one scale transfers to every scale you learn afterward; breadth without depth transfers nothing.",
    },
    {
      question: "Should I learn all five pentatonic boxes at once?",
      answer:
        "No. Master box 1, then learn box 2 by connecting it to box 1 along the seam they share, then extend the chain. Learning boxes as isolated shapes is why so many players know five patterns and can still only solo in one place on the neck.",
    },
    {
      question: "Do I need the CAGED system?",
      answer:
        "You need *some* fretboard map, and CAGED is the most practical one for most players: it anchors scale positions to chord shapes you already know. Fifteen minutes a day for a few months installs it. If you prefer three-notes-per-string systems later, the note knowledge transfers completely.",
    },
    {
      question: "How do I make scale practice less boring?",
      answer:
        "Boredom means repetition without feedback or application. Add both: a metronome and note detection give every run a pass/fail edge, and ending each session with improvisation over a backing track gives the pattern a purpose. Scales practiced as music preparation are absorbing; scales practiced as finger calisthenics are not.",
    },
  ],
  relatedGuideSlugs: [
    "guitar-speed-hand-synchronization-exercises",
    "daily-guitar-practice-plan",
    "intermediate-guitar-practice-routine",
  ],
  relatedBlogSlugs: [
    "how-to-practice-guitar-scales-effectively",
    "best-ear-training-exercises-for-guitarists",
    "benefits-of-learning-guitar-music-theory",
  ],
  relatedSongGuideSlugs: ["stairway-to-heaven"],
};
