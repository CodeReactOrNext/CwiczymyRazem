import type { SeoLandingConfig } from "../types/seoLanding.types";

export const beginnerGuitarExercisesConfig: SeoLandingConfig = {
  slug: "beginner-guitar-exercises",
  title: "Guitar Exercises for Beginners: What to Practice First",
  metaTitle: "Guitar Exercises for Beginners: 8 Free Drills",
  metaDescription:
    "Eight free beginner guitar exercises with interactive tabs — finger drills, strumming, timing and your first bend — plus a 15-minute daily routine.",
  publishedAt: "2026-07-20",
  updatedAt: "2026-07-20",
  intro: [
    "As a beginner, you should practice four things on guitar: fretting-hand accuracy, picking consistency, chord changes, and timing. Every exercise on this page trains one of those, takes under ten minutes, and comes with an interactive tab you can play along with for free.",
    "This is not a random list of beginner guitar drills. It is the same sequence we give new players inside [Riff Quest](/how-it-works): start with one string, add fingers one at a time, and only stack complexity once the previous step feels boring. If you want these drills pre-arranged into a schedule, jump to the [15-minute routine](#a-15-minute-beginner-guitar-practice-routine) below or see the full [daily guitar practice plan](/daily-guitar-practice-plan).",
  ],
  sections: [
    {
      heading: "What to Practice on Guitar as a Beginner",
      blocks: [
        {
          kind: "paragraph",
          text: "The biggest beginner mistake is practicing songs exclusively. Songs are the goal, but they are a terrible teacher of fundamentals: they never repeat a movement enough times in a row for your hands to actually learn it. Effective beginner guitar practice isolates one movement, repeats it slowly with a metronome, and then puts it back into music.",
        },
        {
          kind: "list",
          items: [
            "**Fretting-hand accuracy** — pressing the right fret, right behind the fretwire, with the fingertip and no extra squeeze.",
            "**Picking consistency** — hitting one string on purpose, with the same motion every time, without looking.",
            "**Chord changes** — moving between two shapes without stopping the strumming hand.",
            "**Timing** — playing with a metronome so that your quarter notes actually land on the click.",
          ],
        },
        {
          kind: "paragraph",
          text: "Ten to fifteen focused minutes a day beats a two-hour session on Sunday, every single time. Motor learning consolidates between sessions — your hands improve while you sleep, but only if you gave them something to consolidate. That is why every exercise below is short by design.",
        },
        {
          kind: "tip",
          title: "The tension check",
          text: "Every 60 seconds, stop and relax your shoulders, jaw and fretting thumb. Beginners build speed limits out of tension they never notice. If your hand hurts, you are pressing about three times harder than the string needs.",
        },
      ],
    },
    {
      heading: "First Fretting-Hand Drills",
      blocks: [
        {
          kind: "paragraph",
          text: "Start on a single string. It removes the hardest beginner problem — string targeting — and lets you focus purely on finger placement. These two drills build the finger independence every chord and riff will depend on later.",
        },
        {
          kind: "exercise",
          exerciseId: "spider_one_string",
          commentary: [
            "The single-string spider is the first exercise we recommend to anyone who has held a guitar for less than a month. Four fingers, four frets, one string. Place each finger right behind its fret, and — this is the part that matters — **keep fingers down** as you add the next one. Lifting everything between notes is the habit that makes later chords feel impossible.",
            "Aim for a clean, buzz-free note from every finger, including the pinky. Speed is irrelevant here; 60 BPM with clean notes builds more skill than 120 BPM with buzzing.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "finger_independence_1a",
          commentary: [
            "Once the spider feels comfortable, this drill starts breaking the sympathetic movement between fingers — the tendency of the ring finger to follow the middle, and the pinky to fly away from the fretboard. Watch the fingers that are *not* playing: they should hover a few millimeters over the strings, relaxed, ready.",
            "Two minutes a day of this is genuinely enough. It is a concentration exercise as much as a physical one.",
          ],
        },
      ],
    },
    {
      heading: "Picking and Timing Drills",
      blocks: [
        {
          kind: "paragraph",
          text: "Most beginner guitar exercises focus on the fretting hand, but the picking hand decides how you sound. These two drills train the two picking skills beginners skip: hitting the string you meant to hit, and doing it exactly on the beat.",
        },
        {
          kind: "exercise",
          exerciseId: "open_g_repetition",
          commentary: [
            "One open string, repeated pick strokes. It sounds trivial and it is not: your job is to make every stroke identical — same volume, same attack, same tone. Rest the side of your palm lightly near the bridge for orientation, and keep the motion from the wrist, not the elbow.",
            "Do this with your eyes closed once it feels easy. Blind string targeting is the skill that later lets you watch your fretting hand — or the audience — instead of your pick.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "quarter_notes_drill",
          commentary: [
            "This is your first real metronome workout: quarter notes, locked to the click. The goal is the moment when the click *disappears* — when your note lands so precisely on the beat that the two sounds merge. That is what being 'in time' physically feels like, and you cannot learn it from songs alone.",
            "If you consistently hear the click, you are early or late. Do not guess which — slow down until you find the merge point, then creep the tempo up.",
          ],
        },
      ],
    },
    {
      heading: "Strumming and Chord Drills for Beginners",
      blocks: [
        {
          kind: "paragraph",
          text: "Chords and strumming are where beginners live, so train them like technique, not like a vibe. The progression is strict: downstrokes only, then down-up, then chord changes under a moving strumming hand. If you are still learning shapes, pair this section with our [beginner chord guide](/blog/learn-guitar-chords-beginners-guide).",
        },
        {
          kind: "exercise",
          exerciseId: "strumming_basic",
          commentary: [
            "Down-strums on the beat, nothing else. Keep the wrist loose — the motion is closer to shaking water off your hand than to swatting a fly. Strum from the elbow with a stiff wrist and you will sound harsh and tire quickly.",
            "Focus on hitting the same group of strings each time. Consistent contact is what makes strumming sound intentional instead of accidental.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "strumming_down_up",
          commentary: [
            "The down-up pattern introduces the golden rule of rhythm guitar: **the hand never stops moving**. Down on the beat, up on the 'and', like a pendulum. Even when a pattern skips a strum, the hand still travels — it just misses the strings. Internalize this now and syncopated patterns later will cost you days instead of months.",
          ],
        },
        {
          kind: "exercise",
          exerciseId: "chord_spotlight_drill",
          commentary: [
            "A D major chord has four strings that should ring and two that should not. This drill trains exactly that: strum, listen, and mute what does not belong — the low E with the thumb or a light touch of a fretting finger. Muting is not an advanced technique; it is the difference between a chord and a noise that contains a chord.",
            "Use the drill as a template for every new chord you learn: play it string by string, fix the dead notes, then strum.",
          ],
        },
      ],
    },
    {
      heading: "Your First Lead Technique: the Bend",
      blocks: [
        {
          kind: "paragraph",
          text: "You do not need to wait a year to start lead guitar. A whole-step bend is beginner-accessible, immediately musical, and it trains something no chord drill can: playing in tune with your ears instead of your eyes.",
        },
        {
          kind: "exercise",
          exerciseId: "first_bend",
          commentary: [
            "The secret of bending is that it comes from wrist rotation, not finger strength. Support the bending finger with the ones behind it — three fingers push together — and rotate the wrist like turning a door key. Bend up to the target pitch, hold, listen: is it the same note as the fret two higher? Check by playing that fret first, then matching it.",
            "An out-of-tune bend is the fastest way to sound like a beginner; an in-tune bend is the fastest way to stop sounding like one.",
          ],
        },
      ],
    },
    {
      heading: "A 15-Minute Beginner Guitar Practice Routine",
      blocks: [
        {
          kind: "paragraph",
          text: "Here is how the drills above fit into a daily 15-minute session. This beginner guitar practice routine covers all four fundamentals, and it is intentionally repetitive — you will run the same plan for two to three weeks, raising tempos slightly, before swapping anything out.",
        },
        {
          kind: "schedule",
          schedule: {
            title: "Daily 15-minute beginner routine",
            columns: ["Minutes", "Focus", "What to do"],
            rows: [
              [
                "0–2",
                "Warm-up",
                "[Single String Spider](#spider-one-string) — slow, clean, all four fingers.",
              ],
              [
                "2–5",
                "Fretting hand",
                "[Finger independence](#finger-independence-1a) — quiet hands, no flying pinky.",
              ],
              [
                "5–8",
                "Timing",
                "[Quarter notes with the metronome](#quarter-notes-drill) — make the click disappear.",
              ],
              [
                "8–13",
                "Chords & strumming",
                "[Down-up strumming](#strumming-down-up) into [chord muting](#chord-spotlight-drill) — keep the hand moving through changes.",
              ],
              [
                "13–15",
                "Fun",
                "[First bend](#first-bend), a riff you love, or anything that reminds you why you started.",
              ],
            ],
          },
        },
        {
          kind: "cta",
          title: "Run this routine with real-time feedback",
          text: "Every exercise on this page is built into Riff Quest with interactive tabs, a metronome, and note detection that hears what you play. Track your streak and watch the practice heatmap fill up. Free, no paywalls.",
        },
      ],
    },
    {
      heading: "How to Progress Week to Week",
      blocks: [
        {
          kind: "paragraph",
          text: "Progress on these drills follows a simple rule: **raise the tempo only after three consecutive clean runs**. One clean run can be luck; three in a row is skill. Move up 4–5 BPM at a time, and when a new tempo falls apart, drop back 10 BPM and rebuild.",
        },
        {
          kind: "paragraph",
          text: "After three to four weeks, this page stops being enough — that is the plan working. Your next steps are the [guitar speed and hand synchronization exercises](/guitar-speed-hand-synchronization-exercises) for technique, and the [scale practice routine](/guitar-scale-practice-routine) when you are ready to start playing lead. If motivation is the bottleneck rather than technique, read our guide on [practicing every day in simple steps](/blog/practice-guitar-every-day-simple-steps).",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "What should a beginner practice on guitar first?",
      answer:
        "Start with four fundamentals: single-string finger drills for fretting accuracy, open-string picking for pick control, basic down-up strumming, and quarter notes with a metronome for timing. Ten to fifteen minutes a day across these four areas outperforms unstructured song practice for the first few months.",
    },
    {
      question: "How long should beginner guitar practice sessions be?",
      answer:
        "Fifteen minutes daily is the sweet spot for beginners. Short daily sessions beat long weekly ones because motor skills consolidate between sessions. If your fretting hand aches, stop — pain means excess pressure, not progress.",
    },
    {
      question: "Should beginners use a metronome from day one?",
      answer:
        "Yes, but only on dedicated timing drills, not on everything. Learning a new chord shape needs zero tempo pressure; practicing quarter notes needs a click. Separating 'learning the movement' from 'timing the movement' keeps both from suffering.",
    },
    {
      question: "How long until chord changes feel smooth?",
      answer:
        "With daily practice of a two-chord loop while the strumming hand keeps moving, most beginners get usable changes between open chords in two to four weeks. The key is never stopping the strumming hand — slow, uninterrupted changes rewire faster than fast, stuttering ones.",
    },
    {
      question: "Are these beginner guitar drills enough on their own?",
      answer:
        "For technique, yes — for motivation, no. Pair them with one song you genuinely want to play. The drills make the song achievable; the song makes the drills worth doing. When these feel easy, move on to a structured daily practice plan or speed-focused exercises.",
    },
  ],
  relatedGuideSlugs: [
    "daily-guitar-practice-plan",
    "guitar-speed-hand-synchronization-exercises",
    "guitar-scale-practice-routine",
  ],
  relatedBlogSlugs: [
    "how-to-learn-guitar-online-effectively-for-beginners",
    "beginner-guitar-practice-checklist-daily-essentials",
    "learn-guitar-chords-beginners-guide",
  ],
  relatedSongGuideSlugs: ["nothing-else-matters", "hotel-california"],
};
