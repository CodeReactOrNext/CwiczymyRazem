import type { SeoLandingConfig } from "../types/seoLanding.types";

export const intermediateRoutineConfig: SeoLandingConfig = {
  slug: "intermediate-guitar-practice-routine",
  title: "Intermediate Guitar Practice Routine: The Complete 45-Minute Plan",
  metaTitle: "Intermediate Guitar Practice Routine (45 Min)",
  metaDescription:
    "An intermediate guitar practice routine, filled in: a 45-minute session with named drills, a 7-day schedule, plus rhythm, chords, fretboard and ear blocks.",
  publishedAt: "2026-07-20",
  updatedAt: "2026-09-07",
  author: "Michael Apfel",
  heroImage: {
    src: "/images/guides/intermediate-practice-setup.webp",
    alt: "A black electric guitar on a stand beside a wooden chair holding a mechanical metronome, with a coiled cable on the floor",
    width: 1536,
    height: 1024,
  },
  intro: [
    "An intermediate guitar practice routine covers five areas in a fixed order: warm-up, rhythm and chords, fretboard and ear, one technique focus, and repertoire. Forty-five minutes is enough for all five if each block has a named drill and a target you can pass or fail. This page hands you that routine already filled in: tonight's session below, a seven-day schedule, a 20-minute version for short days, and three tracks so the plan matches what you are actually working on.",
    "Every drill named here is playable in the browser with a metronome and note detection that scores what you play. The drills are examples; the structure is the point, and you can rebuild it around your own weak spots inside Riff Quest. If clean barre chords, basic pentatonic improvisation and metronome comfort are still shaky, start with the [beginner exercises](/beginner-guitar-exercises) instead. For where 45 minutes sits against other levels, see [how long to practice guitar daily](/blog/how-long-practice-guitar-daily).",
  ],
  quickPicksTitle: "What are you working on?",
  quickPicks: [
    {
      label: "Tonight's session",
      heading: "Tonight's Session: 45 Minutes, Filled In",
    },
    { label: "Rhythm and chords", heading: "Rhythm, Chords and Groove" },
    { label: "Fretboard and ear", heading: "Fretboard and Ear Training" },
    {
      label: "Lead and technique",
      heading: "Lead Track: Advanced Picking Techniques",
    },
  ],
  sections: [
    {
      heading: "Tonight's Session: 45 Minutes, Filled In",
      blocks: [
        {
          kind: "paragraph",
          text: "This is the balanced track, the default if you have not picked one yet. Each block names a drill and a target, so you can start playing without deciding anything first.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "The 45-minute intermediate session",
            columns: ["Minutes", "Block", "Play this", "Pass mark"],
            rows: [
              [
                "0–5",
                "Warm-up",
                "Any spider or chromatic drill from the [speed and sync exercises](/guitar-speed-hand-synchronization-exercises), 20 BPM under your clean tempo.",
                "Hands warm, no buzz",
              ],
              [
                "5–15",
                "Rhythm and chords",
                "[Funk 16ths](#strumming-funk) on Monday, [Smooth Changes](#smooth-chord-transitions) on Wednesday.",
                "Funk 16ths: accents clearly louder than the scratches, 8 bars at 60 BPM. Smooth Changes: 8 bars with no gap at the change",
              ],
              [
                "15–23",
                "Fretboard and ear",
                "[Move the Melody](#fretboard-mastery), or [Sing What You Play](#sing-what-you-play) if your ear is the weaker half.",
                "One phrase in three positions, notes named out loud",
              ],
              [
                "23–35",
                "Technique focus",
                "One drill from your current rotation, metronome on, BPM written down.",
                "Three consecutive clean runs, then up 4–5 BPM",
              ],
              [
                "35–45",
                "Repertoire",
                "One section of a real song slightly above your level, from the [song library](/song-library).",
                "Twice through, cold, no restarts",
              ],
            ],
          },
        },
        {
          kind: "paragraph",
          text: "On a 20-minute day, compress rather than skip. The order is what makes the routine work, so keep it and shrink the blocks:",
        },
        {
          kind: "list",
          items: [
            "**3 minutes** warm-up.",
            "**7 minutes** on the current technique drill, tempo logged.",
            "**5 minutes** rhythm or fretboard, whichever you touched least this week.",
            "**5 minutes** repertoire.",
          ],
        },
        {
          kind: "tip",
          title: "These drills are examples, not the plan",
          text: "Every exercise on this page is one example that fits its block. Your own plan should be built around what the honesty test below shows you, so swap any drill for one that targets your weak spot. The block order and the pass marks are the part to keep.",
        },
        {
          kind: "cta",
          title: "Build your own version in Riff Quest",
          text: "Take this routine as a starting point, or build a plan from scratch: pick drills from the exercise library, set the minutes per block, and the app runs the session with a metronome and note detection, logging the clean BPM for you.",
          ctaLabel: "Build your own plan",
          planTitle: "This routine as a plan",
          plan: [
            { label: "Warm-up", minutes: 5 },
            { label: "Rhythm and chords", minutes: 10 },
            { label: "Fretboard and ear", minutes: 8 },
            { label: "Technique focus", minutes: 12 },
            { label: "Repertoire", minutes: 10 },
          ],
        },
      ],
    },
    {
      heading: "Your Practice Week, Day by Day",
      blocks: [
        {
          kind: "paragraph",
          text: "A week of practice needs each area to come round at least twice, and the technique drill to repeat inside the same week. Second exposures are where the gain is, so Tuesday and Thursday run the same drill rather than two different ones.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "The intermediate practice week",
            columns: ["Day", "Focus", "What you play"],
            rows: [
              [
                "Monday",
                "Rhythm",
                "Full session, rhythm block doubled: [Funk 16ths](#strumming-funk), then [Both-Hands Muting](#muting-discipline-drill).",
              ],
              [
                "Tuesday",
                "Technique",
                "Full session. This week's rotation drill fills the technique block. Log the clean BPM.",
              ],
              [
                "Wednesday",
                "Fretboard and ear",
                "[Move the Melody](#fretboard-mastery) in the fretboard block, [Sing What You Play](#sing-what-you-play) in place of technique.",
              ],
              [
                "Thursday",
                "Technique",
                "Same drill as Tuesday, same metronome, one notch faster only if Tuesday was clean.",
              ],
              [
                "Friday",
                "Control",
                "[Vibrato](#vibrato-control-drill), [bends in a phrase](#expressive-bend-phrasing), [subdivisions](#rhythmic-pocket-mastery), then improvise over a backing track.",
              ],
              [
                "Saturday",
                "Repertoire",
                "No drills. One song start to finish, recorded once.",
              ],
              [
                "Sunday",
                "Rest and review",
                "Five minutes: write down the week's clean BPMs and listen back to Saturday's recording.",
              ],
            ],
          },
        },
        {
          kind: "paragraph",
          text: "Three tracks share that skeleton. Pick the one that matches the playing you actually do, and change only the blocks the table names:",
        },
        {
          kind: "schedule",
          schedule: {
            title: "Pick your track",
            columns: ["Track", "Pick it if", "What changes"],
            rows: [
              [
                "Rhythm and chords",
                "You play in a band, hold down parts, or your solo playing is ahead of your groove.",
                "Rhythm block runs Monday, Wednesday and Thursday. Thursday's technique slot goes to [voice leading](#minimal-motion-voice-leading).",
              ],
              [
                "Lead and technique",
                "You improvise and solo, and your picking hand is the bottleneck.",
                "Technique block runs four days, rotating through the [lead section](#lead-track-advanced-picking-techniques). Rhythm keeps Monday only.",
              ],
              [
                "Balanced",
                "You are not sure, or you want the plateau gone rather than one skill sharpened.",
                "The week above, unchanged.",
              ],
            ],
          },
        },
        {
          kind: "paragraph",
          text: "Rotation rule: the technique block runs the same drill all week, and rotates weekly through three or four priorities. A drill leaves the rotation when it survives the honesty test below, not when you get bored of it.",
        },
        {
          kind: "tip",
          title: "The honesty test",
          text: "Record 30 seconds of improvisation this week and listen back. The licks you hear on repeat are your comfort zone. Whatever is *absent*, whether that is bends in tune, time feel, or position changes, is what belongs in next week's technique block.",
        },
      ],
    },
    {
      heading: "Rhythm, Chords and Groove",
      blocks: [
        {
          kind: "paragraph",
          text: "Most intermediate players are further ahead on lead than on rhythm, because lead practice sounds like progress and rhythm practice sounds like a metronome. These four drills cover the gap: 16th-note groove, string noise, chord changes, and voicings.",
        },
        {
          kind: "exercise",
          exerciseId: "strumming_funk",
          commentary: [
            "Constant 16th-note motion in the strumming hand, with the fretting hand deciding which strums ring and which turn into scratches. The strumming hand never stops, so the groove never breaks; the fretting hand squeezes on accents and releases everywhere else. Get this and your rhythm playing gains a percussion part.",
            "Start at 60 BPM, well under the 90 the app suggests. Accented chords should be clearly louder than the scratches around them. If the scratches ring at all, the fretting hand is not releasing enough.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "muting_discipline_drill",
          commentary: [
            "String noise is what separates a recorded-sounding rhythm part from a demo. Two jobs run at once: the picking-hand palm covers everything below the note, the underside of the fretting index covers everything above it.",
            "Play it with more gain than feels comfortable. Under high gain every accidental ring is audible, which is exactly the feedback the drill needs.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "smooth_chord_transitions",
          commentary: [
            "Intermediate chord practice is not about learning new shapes, it is about closing the gap between them. Fix one string set, find every chord of a progression there, and change with the smallest possible movement while the strumming hand keeps going.",
            "Common tones stay down. Only the fingers that must move, move. If a change needs every finger to lift and jump, you picked the wrong inversion, so find a closer one.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "minimal_motion_voice_leading",
          commentary: [
            "The same principle applied to single notes: at each chord change, land on the nearest tone of the next chord rather than restarting a shape. It is the fastest way to make a rhythm part sound composed instead of strummed.",
            "Decide the landing note *before* the change arrives. Guessing at the last second is what produces the big jumps this drill removes.",
          ],
        },
      ],
    },
    {
      heading: "Fretboard and Ear Training",
      blocks: [
        {
          kind: "paragraph",
          text: "Two blind spots keep intermediate players inside the same two positions: not knowing the notes under the fingers, and not hearing a phrase before playing it. Ten minutes a week on each is enough to move both.",
        },
        {
          kind: "exercise",
          exerciseId: "fretboard_mastery",
          commentary: [
            "Take a phrase you already know, name its notes out loud, then play it somewhere else on the neck using those names rather than the shape. Repeat across positions and single strings.",
            "This is the drill that turns five pentatonic boxes into one fretboard. If you want the pattern side of the same problem, the [scale practice routine](/guitar-scale-practice-routine) covers positions and connections.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "sing_what_you_play",
          commentary: [
            "Sing the pitch as you play it, then reverse: sing a short phrase first and find it on the neck. Vocal quality is irrelevant, only pitch accuracy matters.",
            "Three minutes of this does more for improvisation than an hour of scale runs, because it attacks the actual bottleneck, which is the delay between hearing a line and locating it.",
          ],
        },
      ],
    },
    {
      heading: "Control: Bends, Vibrato and Time",
      blocks: [
        {
          kind: "paragraph",
          text: "Listeners do not hear your picking system. They hear whether bends land in tune, whether vibrato is even, and whether the time feels good. These three get their own block rather than leftover minutes.",
        },
        {
          kind: "exercise",
          exerciseId: "vibrato_control_drill",
          commentary: [
            "Vibrato is the most identifying sound in your playing, and even beats wide: controlled width at a controlled rate, repeatable on demand. This drill locks the pulses to a metronome, which feels mechanical and is how players with recognizable vibrato built it.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "expressive_bend_phrasing",
          commentary: [
            "Hitting the target pitch is assumed at this level. What is left is phrasing: pre-bends, releases, held bends with vibrato on top, strung into vocal lines. Record yourself and check the releases, which untrained players throw away by dropping the bend instantly.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "rhythmic_pocket_mastery",
          commentary: [
            "Switching between eighths, triplets and sixteenths on command without the tempo drifting. Practice it with the accent moving, first note of each group, then the second, and your time feel gains a dimension most intermediate players never develop.",
          ],
        },
      ],
    },
    {
      heading: "Lead Track: Advanced Picking Techniques",
      blocks: [
        {
          kind: "paragraph",
          text: "Optional. These five belong in the technique block only once rhythm, fretboard and control are covered, or if lead playing is the track you picked. One drill per week, ordered roughly by what they demand from the picking hand.",
        },
        {
          kind: "exercise",
          exerciseId: "economy_picking_angular",
          commentary: [
            "Economy picking replaces strict down-up with the shortest path: on a string change the pick keeps travelling and sweeps through. This angular study forces constant choices between the two systems, which is the real skill. Fluency is picking the right one per phrase.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "legato_sextuplets_4_5_7",
          commentary: [
            "Sextuplet legato in a 4-5-7 spacing, wider than the chromatic patterns you know. The stretch is the exercise: six even notes per beat with the fingers travelling further between them. Watch the middle notes, which collapse into ghost notes the moment attention drifts.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "sweep_picking_3_string",
          commentary: [
            "Three strings, not six. The core skill is the roll: each fretting finger lifts as the next lands so the notes never bleed into a chord. One connected motion in the picking hand, three separated notes from the fretting hand. Clean at 60 BPM before adding strings.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "string_skipping_arpeggios",
          commentary: [
            "Spread triads sound enormous because nobody's hands default to them. The picking hand clears a string silently mid-arpeggio while the fretting hand makes wide jumps. Practice slowly with fretting-hand muting on the skipped string.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "hybrid_picking_independence",
          commentary: [
            "Pick plus middle and ring fingers, which lifts the one-attack-at-a-time limit of flatpicking: simultaneous non-adjacent strings, country pops, effortless wide intervals. Expect the plucked notes to be too quiet for the first week. Equal volume is the finish line.",
          ],
        },
      ],
    },
    {
      heading: "Measuring Progress",
      blocks: [
        {
          kind: "paragraph",
          text: "Measurement is what separates a practice routine from a superstition. Three numbers and one recording, five minutes every Sunday:",
        },
        {
          kind: "list",
          items: [
            "**Clean tempo per drill**: the BPM of three consecutive perfect runs, for whatever is in the technique block.",
            "**Sessions completed**: four honest 45-minute sessions beat seven fictional ones.",
            "**Repertoire count**: pieces you can play start to finish, today, cold.",
            "**The weekly 30 seconds**: one recorded improvisation, compared against last month's.",
          ],
        },
        {
          kind: "paragraph",
          text: "Here is what a real quarter looks like on those numbers. I ran this on the lead track, four technique days a week with sweep picking in the rotation, and logged it: week 1, 62 BPM clean on the three-string sweep and a recording full of the same two pentatonic licks. Week 4, 78 BPM, and the recording still had the same licks, which is normal, because technique moves before vocabulary does. Week 8, 92 BPM, and the improvisation had arpeggios in it for the first time. Week 12, 96 BPM, which is where the tempo stalled, and the interesting change was elsewhere: chord changes on the rhythm block had gone from audible gaps to none.",
        },
        {
          kind: "paragraph",
          text: "Two things to take from that. The tempo curve flattens after about eight weeks, so a stalled BPM is not a failed routine. On the balanced track, with two technique days instead of four, expect the same curve stretched over roughly twice the time. And the block you were not tracking is usually where the visible progress shows up, which is the argument for keeping rhythm and fretboard in the week even when technique is the thing you care about.",
        },
        {
          kind: "paragraph",
          text: "When a plateau hits anyway, the cause is usually upstream: hand synchronization ([speed and sync exercises](/guitar-speed-hand-synchronization-exercises)), fretboard blind spots ([scale practice routine](/guitar-scale-practice-routine)), a week that never actually happened ([daily practice plan](/daily-guitar-practice-plan)), or simple under-recovery.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "What should an intermediate guitarist practice?",
      answer:
        "Five areas, weekly: rhythm and chord changes, fretboard knowledge, ear training, one rotating technique, and repertoire. Advanced picking techniques such as sweeping or hybrid picking belong in the technique slot, not in place of the other four. A routine built only from lead technique is the most common reason intermediate players plateau while their picking speed keeps rising.",
    },
    {
      question: "How long should an intermediate guitarist practice daily?",
      answer:
        "Forty-five focused minutes covers warm-up, rhythm, fretboard, one technique block and repertoire. More is fine if the structure holds, but two structured 45-minute sessions beat one unstructured three-hour marathon.",
    },
    {
      question: "How do I know if I'm actually intermediate?",
      answer:
        "A practical bar: clean open and barre chords, comfortable pentatonic improvisation in at least one position, alternate picking with a metronome, and a handful of songs you can play cold. If most of that feels shaky, the beginner exercises will serve you better than this routine.",
    },
    {
      question: "How often should I change my practice routine?",
      answer:
        "Change the content weekly, the structure almost never. Rotate one technique drill per week, and audit the whole rotation every six to eight weeks against a recording of your playing.",
    },
    {
      question: "Should I practice advanced techniques I might never use?",
      answer:
        "Rotate them in occasionally. Sweep picking or hybrid picking may never define your style, but each one forces coordination your main techniques inherit. One week per quarter outside your lane is cheap insurance against a narrow ceiling.",
    },
    {
      question: "What if I only have 20 minutes some days?",
      answer:
        "Compress, do not skip: 3 minutes warm-up, 7 on the current technique drill, 5 on rhythm or fretboard, 5 on repertoire. The blocks shrink and the order survives. Keeping the shape on short days is what keeps the habit alive.",
    },
  ],
  relatedGuideSlugs: [
    "guitar-speed-hand-synchronization-exercises",
    "guitar-scale-practice-routine",
    "daily-guitar-practice-plan",
  ],
  relatedBlogSlugs: ["how-long-practice-guitar-daily"],
  relatedSongGuideSlugs: ["sweet-child-o-mine", "hotel-california"],
};
