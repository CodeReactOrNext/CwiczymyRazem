import type { SeoLandingConfig } from "../types/seoLanding.types";

export const dailyPracticePlanConfig: SeoLandingConfig = {
  slug: "daily-guitar-practice-plan",
  title: "Daily Guitar Practice Plan: Routines for 15, 30 and 60 Minutes",
  metaTitle: "Daily Guitar Practice Plan: 15/30/60 Minutes",
  metaDescription:
    "Ready-made daily guitar practice routines for 15, 30 and 60 minutes — with example exercises, a beginner practice schedule, and a system for staying consistent.",
  publishedAt: "2026-07-20",
  updatedAt: "2026-07-20",
  intro: [
    "A daily guitar practice plan needs to answer exactly two questions before you pick up the instrument: *what am I working on today* and *for how long*. Answer them in advance and practice happens; leave them for the moment you sit down and the session dissolves into noodling and YouTube.",
    "Below are three complete daily guitar practice routines — 15, 30 and 60 minutes — each with time blocks, example exercises with interactive tabs, and a clear rule for what to do when life shrinks your day. Pick the plan that matches your *worst* day, not your best one: the schedule you can keep on a bad Tuesday is the one that compounds.",
  ],
  sections: [
    {
      heading: "How Long Should You Practice Guitar Every Day?",
      blocks: [
        {
          kind: "paragraph",
          text: "Less than you think, more often than you'd like. Motor learning is dose-dependent but consolidation-limited: your nervous system rebuilds the skills you practiced during sleep, and it can only consolidate what fits in a session's worth of focused attention. Fifteen focused daily minutes reliably outperforms a two-hour Sunday marathon — the marathon player practices once a week; the daily player consolidates seven times.",
        },
        {
          kind: "paragraph",
          text: "The honest hierarchy: **daily beats long, focused beats casual, planned beats improvised.** Our deep dive on [how long to practice guitar daily](/blog/how-long-practice-guitar-daily) covers the research; the short version is that consistency is the only variable beginners and intermediates should optimize. That is also why every plan below fits in a lunch break.",
        },
        {
          kind: "tip",
          title: "The two-day rule",
          text: "Never miss twice. Missing one day is life; missing two is the start of a new habit — not practicing. If a day collapses, the next day's minimum is five minutes of anything. The streak matters more than the session.",
        },
      ],
    },
    {
      heading: "The 15-Minute Daily Guitar Practice Routine",
      blocks: [
        {
          kind: "paragraph",
          text: "The minimum effective dose, and the right starting point for every beginner guitar practice plan: warm-up, one technique, one dose of rhythm. It is deliberately repetitive — you will run the same 15 minutes for weeks, and that repetition is precisely what makes it work.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "15-minute daily plan",
            columns: ["Minutes", "Block", "What to do"],
            rows: [
              [
                "0–3",
                "Warm-up",
                "[Stretching drill](#jp-stretching) below, or slow spider patterns — loose hands, zero tempo pressure.",
              ],
              [
                "3–10",
                "Main skill",
                "Your current priority: [beginner drills](/beginner-guitar-exercises), a [scale position](/guitar-scale-practice-routine), or one [speed exercise](/guitar-speed-hand-synchronization-exercises). One skill only.",
              ],
              [
                "10–15",
                "Rhythm & fun",
                "[Triplets drill](#rhythm-triole) with the metronome, then one minute of playing anything you love.",
              ],
            ],
          },
        },
        {
          kind: "exercise",
          exerciseId: "jp_stretching",
          commentary: [
            "A gentle stretching sequence popularized by John Petrucci's practice philosophy: wide finger spacings played slowly, warming up the hand's full range before any speed work. Two rules — no pain, ever, and no clock-racing. This is the block that protects the other twelve minutes (and your tendons) for the years ahead.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "rhythm_triole",
          commentary: [
            "Triplets against a steady click — the simplest rhythm drill that most self-taught players have never actually done. Feeling three-against-the-beat on demand is a prerequisite for shuffle, blues, and half of rock's greatest riffs. Two minutes daily here upgrades everything else you play; timing is the skill listeners notice before any other.",
          ],
        },
      ],
    },
    {
      heading: "The 30-Minute Plan",
      blocks: [
        {
          kind: "paragraph",
          text: "The 30-minute guitar daily practice routine adds what 15 minutes cannot fit: a dedicated technique block *and* repertoire in the same session. This is the plan where most hobbyists live long-term, and it is enough to reach a solid intermediate level within a couple of years.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "30-minute daily plan",
            columns: ["Minutes", "Block", "What to do"],
            rows: [
              [
                "0–5",
                "Warm-up",
                "[Stretching](#jp-stretching) plus one slow synchronization drill.",
              ],
              [
                "5–15",
                "Technique",
                "This week's technique focus with a metronome — log your clean tempo. Example below: [muting](#muting-spotlight-drill).",
              ],
              [
                "15–22",
                "Control",
                "Expression work: [vibrato](#vibrato-low-position), bends, or dynamics. The block that makes you sound good, not just fast.",
              ],
              [
                "22–30",
                "Repertoire",
                "A song slightly above your level from the [song library](/song-library) — the place where technique becomes music.",
              ],
            ],
          },
        },
        {
          kind: "exercise",
          exerciseId: "muting_spotlight_drill",
          commentary: [
            "An example technique block: play one string, silence all the others. Unwanted string noise is the most audible difference between amateur and professional playing — especially with distortion — and it never fixes itself, because your ear edits it out live. This drill makes the noise impossible to ignore, which is the first and hardest step to eliminating it.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "vibrato_low_position",
          commentary: [
            "An example control block: vibrato in the low frets, where string tension is highest and sloppy technique has nowhere to hide. Slow, even pulses, wrist-driven. Five minutes of deliberate vibrato work per day, for a month, changes how every note you hold sounds — a better return than any gear purchase you will ever make.",
          ],
        },
      ],
    },
    {
      heading: "The 60-Minute Plan",
      blocks: [
        {
          kind: "paragraph",
          text: "The full guitar practice schedule for players pushing at their ceiling. The extra half hour does not go into more technique — it goes into the two things shorter plans always sacrifice: ear training and improvisation. Hands are half the instrument; this is the plan that trains the other half.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "60-minute daily plan",
            columns: ["Minutes", "Block", "What to do"],
            rows: [
              [
                "0–8",
                "Warm-up & sync",
                "[Stretching](#jp-stretching), then spider work at moderate tempo from the [speed exercises](/guitar-speed-hand-synchronization-exercises).",
              ],
              [
                "8–23",
                "Technique",
                "Deep block on one rotating technique — the [intermediate routine](/intermediate-guitar-practice-routine) has the full rotation system.",
              ],
              [
                "23–33",
                "Scales & fretboard",
                "The [15-minute scale routine](/guitar-scale-practice-routine), compressed: position drill + note hunt.",
              ],
              [
                "33–41",
                "Ear training",
                "[Interval recognition](#earTrainingEasy) — the block below. Ears before fingers.",
              ],
              [
                "41–50",
                "Improvisation",
                "[Guided improv](#improv-prompt-easy) over a backing track, one constraint per day.",
              ],
              [
                "50–60",
                "Repertoire",
                "Song work, and end by recording 30 seconds — your weekly progress evidence.",
              ],
            ],
          },
        },
        {
          kind: "exercise",
          exerciseId: "earTrainingEasy",
          commentary: [
            "Interval recognition, gamified: the app plays two notes and you identify the distance. Every skill on this page bottlenecks through the ear eventually — you cannot play in tune, bend in tune, or improvise melodically past what you can hear. Eight minutes a day here compounds faster than any physical drill, because ear gains never plateau the way finger speed does.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "improv_prompt_easy",
          commentary: [
            "Guided improvisation with a constraint per round — three notes only, one string only, rhythm fixed. Constraints are what make improv *practice* rather than habit rehearsal: they push you off your patterns and force real-time decisions. This is where everything else in the plan — scales, techniques, ears — proves it belongs to you and not just to the exercises.",
          ],
        },
      ],
    },
    {
      heading: "How to Stay Consistent (the Hard Part)",
      blocks: [
        {
          kind: "paragraph",
          text: "Nobody fails at daily practice because the exercises were wrong. They fail because the habit had no infrastructure. Four pieces of infrastructure, in order of impact:",
        },
        {
          kind: "list",
          items: [
            "**Same time, same trigger.** Attach practice to an existing daily event — after coffee, before dinner. A plan without a trigger is a wish.",
            "**Guitar on a stand, never in a case.** The ten seconds of unpacking is, measurably, where daily practice goes to die.",
            "**Track the streak.** A visible chain of practiced days recruits loss aversion — the strongest motivator you own — to guitar's side.",
            "**Log what you did.** One line per session. Next session starts where the last one ended instead of re-deciding everything.",
          ],
        },
        {
          kind: "cta",
          title: "Riff Quest is the infrastructure",
          text: "Streaks, a GitHub-style practice heatmap, session logging, XP and a community leaderboard — plus every exercise above with interactive tabs and real-time feedback. The plan lives in the app so your willpower doesn't have to carry it. Free, no paywalls.",
        },
        {
          kind: "paragraph",
          text: "If motivation itself is the bottleneck, our guides on [practicing every day in simple steps](/blog/practice-guitar-every-day-simple-steps) and [what to practice on guitar daily](/blog/what-to-practice-on-guitar-daily) go deeper. And when the 30-minute plan starts feeling small, graduate to the full [intermediate practice routine](/intermediate-guitar-practice-routine).",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Is 15 minutes of guitar practice a day enough?",
      answer:
        "Yes — if it is structured and daily. Fifteen focused minutes with a warm-up, one main skill and a rhythm block produces steady beginner progress, and consistently beats occasional long sessions because skills consolidate between sessions. It is the minimum effective dose, not a compromise.",
    },
    {
      question: "Should I practice guitar every day or take rest days?",
      answer:
        "Practice daily, vary the load. Hands recover from a 15–30 minute session overnight; what needs managing is intensity, so follow a heavy technique day with a lighter repertoire-and-ears day. If you feel actual pain — not fatigue — rest and check your technique and posture before resuming.",
    },
    {
      question: "What should a beginner guitar practice schedule look like?",
      answer:
        "Start with the 15-minute plan: three minutes of warm-up, seven on one fundamental skill (chords, single-string drills or timing), five on rhythm plus something fun. Run it daily for a month before adding time. The beginner exercises page on this site provides the drills to slot into the main block.",
    },
    {
      question: "Is it better to practice guitar in the morning or evening?",
      answer:
        "Whichever time you can defend every day — consistency of the slot beats its position on the clock. Morning sessions tend to survive schedule chaos better; evening sessions benefit from sleep consolidating what you just practiced. Pick one, attach it to an existing habit, and stop optimizing.",
    },
    {
      question: "What if I miss a day of my practice plan?",
      answer:
        "Apply the two-day rule: never miss twice in a row. One missed day has no measurable effect on progress; the danger is the identity shift from 'someone who practices daily' to 'someone who used to'. The day after a miss, do five minutes minimum — the streak you protect is the habit itself.",
    },
  ],
  relatedGuideSlugs: [
    "beginner-guitar-exercises",
    "intermediate-guitar-practice-routine",
    "guitar-scale-practice-routine",
  ],
  relatedBlogSlugs: [
    "how-long-practice-guitar-daily",
    "what-to-practice-on-guitar-daily",
    "practice-guitar-every-day-simple-steps",
  ],
  relatedSongGuideSlugs: ["nothing-else-matters"],
};
