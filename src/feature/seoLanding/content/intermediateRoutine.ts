import type { SeoLandingConfig } from "../types/seoLanding.types";

export const intermediateRoutineConfig: SeoLandingConfig = {
  slug: "intermediate-guitar-practice-routine",
  title: "Intermediate Guitar Practice Routine: a Structured 45-Minute Plan",
  metaTitle: "Intermediate Guitar Practice Routine (45 Min)",
  metaDescription:
    "A structured intermediate guitar practice routine: 45 minutes in four blocks, advanced techniques to rotate weekly, and how to measure real progress.",
  publishedAt: "2026-07-20",
  updatedAt: "2026-07-20",
  intro: [
    "An effective intermediate guitar practice routine has three properties: fixed structure, rotating content, and measurement. Structure decides *when* you work on what, rotation keeps techniques from going stale, and measurement tells you whether any of it is working. Miss one of the three and you get the classic intermediate plateau — busy hands, flat progress.",
    "This page gives you the complete system: a 45-minute session template, eight advanced technique exercises with interactive tabs to rotate through it, and a measurement habit that takes five minutes a week. If you are still building first fundamentals, start with the [beginner exercises](/beginner-guitar-exercises) instead — this routine assumes clean chords, basic scale fluency and metronome comfort.",
  ],
  sections: [
    {
      heading: "Why Random Noodling Stalls Intermediate Players",
      blocks: [
        {
          kind: "paragraph",
          text: "Beginners improve no matter what they do, because everything is new. Intermediates lose that free lunch: the skills that remain are exactly the ones your fingers do not drift toward on their own. Noodling gravitates to what already sounds good — which is, by definition, the stuff you no longer need to practice.",
        },
        {
          kind: "paragraph",
          text: "Structured guitar practice inverts this. You decide the weak points in advance, schedule them, and let the calendar — not your mood — pick tonight's material. It feels less fun for the first two weeks. Then the progress kicks in, and progress is more fun than noodling ever was.",
        },
        {
          kind: "tip",
          title: "The honesty test",
          text: "Record 30 seconds of your improvisation this week and listen back. The licks you hear on repeat are your comfort zone; whatever is *absent* — bends in tune? time feel? position changes? — is what belongs in next week's technique block.",
        },
      ],
    },
    {
      heading: "The Structure: 45 Minutes in Four Blocks",
      blocks: [
        {
          kind: "paragraph",
          text: "The session template never changes; only the content inside the blocks rotates. This is deliberate: a fixed skeleton removes the daily what-should-I-practice negotiation, which is where most practice time quietly dies.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "The 45-minute intermediate session",
            columns: ["Minutes", "Block", "What goes in it"],
            rows: [
              [
                "0–8",
                "Warm-up & sync",
                "Spider or chromatic drills at moderate tempo — see the [speed & sync exercises](/guitar-speed-hand-synchronization-exercises). Never skip; cold hands rehearse mistakes.",
              ],
              [
                "8–23",
                "Technique focus",
                "**One** technique from your current rotation (below), metronome on, tempo logged. Fifteen minutes on one thing beats five minutes on three things.",
              ],
              [
                "23–33",
                "Control & musicality",
                "Bends, vibrato and time feel — the [control block exercises](#control-block-bends-vibrato-and-time) below, or improvisation over a backing track with one constraint.",
              ],
              [
                "33–45",
                "Repertoire",
                "A real song or solo slightly above your level. This is where techniques become music — pick material from the [song library](/song-library) rated near your level.",
              ],
            ],
          },
        },
        {
          kind: "paragraph",
          text: "Rotation rule: the technique block runs the same exercise for a full week (short daily exposures build skill; daily novelty builds nothing), and rotates weekly through your 3–4 current priorities. A technique leaves the rotation when it survives the honesty test above — not when you are bored of it.",
        },
      ],
    },
    {
      heading: "Technique Block: Advanced Techniques to Rotate",
      blocks: [
        {
          kind: "paragraph",
          text: "Five advanced guitar techniques, each with an interactive tab, each worth a week or more in the technique block. They are ordered roughly by how much they demand from the picking hand — pick the one that exposes your current weakness, not the one that looks coolest.",
        },
        {
          kind: "exercise",
          exerciseId: "economy_picking_angular",
          commentary: [
            "Economy picking replaces alternate picking's strict down-up with the shortest possible path: when changing strings, the pick continues in its direction of travel, sweeping through. This angular study forces constant decisions between the two systems — which is the real skill. Players who only alternate-pick work harder than they need to; players who only sweep lose their rhythmic anchor. Fluency is choosing per phrase.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "legato_sextuplets_4_5_7",
          commentary: [
            "Sextuplet legato in a 4-5-7 fret spacing — wider than the chromatic patterns you know, and that stretch is the exercise: hitting six even notes per beat when the fingers travel further between them. Watch the middle notes of each sextuplet; they collapse to ghost notes the moment your attention drifts. This is fretting-hand endurance training as much as technique.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "sweep_picking_3_string",
          commentary: [
            "Three-string sweeps are where sweep picking should start — not five- and six-string monsters. The core skill is the roll: each fretting finger lifts as the next lands, so the notes never bleed into a chord. One connected motion in the picking hand, three separated notes from the fretting hand. Get this synchronization clean at 60 BPM before adding strings; a blurry sweep at speed is just a strum with ambitions.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "string_skipping_arpeggios",
          commentary: [
            "Spread triads — arpeggios voiced across non-adjacent strings — sound enormous precisely because nobody's hands default to them. The picking hand must clear a string silently mid-arpeggio while the fretting hand makes wide interval jumps. Slow, with fretting-hand muting on the skipped string, this is one of the most modern-sounding tools an intermediate player can add.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "hybrid_picking_independence",
          commentary: [
            "Hybrid picking — pick plus middle and ring fingers — breaks the one-attack-at-a-time limitation of pure flatpicking: simultaneous non-adjacent strings, snappy country pops, effortless wide intervals. The independence drill matters because the plucking fingers must develop their own timing rather than shadowing the pick. Expect the finger-plucked notes to be too quiet for the first week; equal volume is the finish line.",
          ],
        },
      ],
    },
    {
      heading: "Control Block: Bends, Vibrato and Time",
      blocks: [
        {
          kind: "paragraph",
          text: "Listeners do not hear your picking system — they hear whether your bends land in tune, whether your vibrato is even, and whether your time feels good. These three exercises are the highest-ROI ten minutes in the whole routine, which is why they get a dedicated block instead of leftovers.",
        },
        {
          kind: "exercise",
          exerciseId: "vibrato_control_drill",
          commentary: [
            "Vibrato is the most identifying sound in your playing, and 'even' beats 'wide': controlled pitch width at a controlled rate, repeatable on demand. This drill puts a metronome under your vibrato — pulses locked to the click — which feels absurdly mechanical and is exactly how every player with famous vibrato built it. Mechanical first, expressive forever after.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "expressive_bend_phrasing",
          commentary: [
            "Beyond hitting the target pitch (which is assumed at this level), bends carry phrasing: pre-bends, releases, held bends with vibrato on top. This study strings them into vocal lines. Record yourself and check the *releases* — untrained players release bends instantly, throwing away half the expressive material in every bend they play.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "rhythmic_pocket_mastery",
          commentary: [
            "Subdivision control: switching between eighths, triplets and sixteenths on command without the tempo drifting. This is the skill that makes a band trust you. Practice it with the accent moving — first note of each group, then second — and your time feel gains a dimension most intermediate players never develop.",
          ],
        },
      ],
    },
    {
      heading: "Measuring Progress (So the Routine Actually Works)",
      blocks: [
        {
          kind: "paragraph",
          text: "Measurement is what separates a structured guitar practice routine from a superstition. You need exactly three numbers and one recording, five minutes a week:",
        },
        {
          kind: "list",
          items: [
            "**Clean tempo per technique** — the BPM of three consecutive perfect runs, logged weekly for whatever is in the technique block.",
            "**Practice consistency** — sessions completed this week. Four honest 45-minute sessions beat seven fictional ones.",
            "**Repertoire count** — pieces you can play start to finish, today, cold.",
            "**The weekly 30 seconds** — one recorded improvisation, compared to last month's. This is the only metric your audience will ever hear.",
          ],
        },
        {
          kind: "cta",
          title: "Let Riff Quest keep the score",
          text: "Log sessions, track clean BPM per exercise, and watch your practice heatmap fill up. The interactive tabs above listen while you play and score your accuracy — so your weekly review reads like data, not memory. Free, no paywalls.",
        },
        {
          kind: "paragraph",
          text: "When a plateau hits anyway — it will — the answer is usually upstream: hand synchronization ([speed & sync exercises](/guitar-speed-hand-synchronization-exercises)), fretboard blind spots ([scale routine](/guitar-scale-practice-routine)), or simple under-recovery, covered in our guide to [breaking through practice stagnation](/blog/guitar-practice-stagnation-solutions).",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How long should an intermediate guitarist practice daily?",
      answer:
        "Forty-five focused minutes is the sweet spot — long enough for warm-up, one deep technique block, control work and repertoire; short enough to sustain daily. More is fine if the structure holds, but two structured 45-minute sessions beat one unstructured three-hour marathon every time.",
    },
    {
      question: "How do I know if I'm actually intermediate?",
      answer:
        "A practical bar: clean open and barre chords, comfortable pentatonic improvisation in at least one position, basic alternate picking with a metronome, and a handful of songs you can play cold. If most of that list feels shaky, the beginner exercises page will serve you better than this routine.",
    },
    {
      question: "How often should I change my practice routine?",
      answer:
        "Change the content weekly, the structure almost never. Rotate one technique per week through the 15-minute technique block, and audit the whole rotation every 6–8 weeks against a recording of your playing. Constant structural rewrites are procrastination wearing a productivity costume.",
    },
    {
      question: "Should I practice advanced techniques I might never use?",
      answer:
        "Rotate them in occasionally anyway. Sweep picking or hybrid picking may never define your style, but each new technique forces coordination your main techniques then inherit. One week per quarter on something outside your lane is cheap insurance against a narrow skill ceiling.",
    },
    {
      question: "What if I only have 20 minutes some days?",
      answer:
        "Compress, don't skip: five minutes of warm-up, ten of the current technique, five of repertoire. The blocks shrink; the order survives. Keeping the routine's shape on short days is what keeps the habit alive — and the habit, not any single session, is what produces intermediate-to-advanced progress.",
    },
  ],
  relatedGuideSlugs: [
    "guitar-speed-hand-synchronization-exercises",
    "guitar-scale-practice-routine",
    "daily-guitar-practice-plan",
  ],
  relatedBlogSlugs: [
    "advanced-guitar-practice-techniques",
    "guitar-practice-stagnation-solutions",
    "easy-guitar-solos-to-learn-for-intermediate-players",
  ],
  relatedSongGuideSlugs: ["sweet-child-o-mine", "hotel-california"],
};
