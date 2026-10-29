import type { SeoLandingConfig } from "feature/seoLanding/types/seoLanding.types";

export const guitarPracticeJournalConfig: SeoLandingConfig = {
  slug: "guitar-practice-journal",
  title: "Guitar Practice Journal: Free Printable PDF and Session Log",
  metaTitle: "Guitar Practice Journal & Log: Free PDF",
  metaDescription:
    "Download a free printable guitar practice journal PDF: a daily session log, clean-tempo tracker and weekly review. Includes an example and instructions.",
  publishedAt: "2026-10-16",
  updatedAt: "2026-10-16",
  intro: [
    "Download a **free guitar practice journal PDF** with a daily session log and a weekly review. The two A4 pages give you space to record what you practiced, how long you played, your clean tempo and what to try next. Print as many copies as you need; no email address or account is required.",
    "A useful guitar practice log is short enough to complete before you put the instrument away. Instead of documenting every note, keep one comparable result and one next step. Below you will find the printable template, a completed example, and a simple way to turn your notes into next week's plan.",
  ],
  quickPicksTitle: "Start with the sheet or see how to use it",
  quickPicks: [
    {
      label: "Download PDF",
      heading: "Download the Guitar Practice Journal PDF",
    },
    {
      label: "Filled-in example",
      heading: "A Filled-In Guitar Practice Log Example",
    },
    { label: "Weekly review", heading: "Turn Your Weekly Review Into a Plan" },
  ],
  sections: [
    {
      heading: "Download the Guitar Practice Journal PDF",
      blocks: [
        {
          kind: "download",
          href: "/downloads/guitar-practice-journal.pdf",
          label: "Guitar Practice Journal (PDF)",
          description:
            "Two A4 pages: a session worksheet and a seven-session weekly review. Free, printable and available without signup.",
          fileMeta: "PDF, 53 KB, 2 A4 pages",
        },
        {
          kind: "paragraph",
          text: "Page one is a reusable worksheet for one practice session: date, available minutes, a specific goal, five exercise rows, and notes about the result and next session. Page two collects seven sessions and a weekly review. All fields are filled in by hand; the PDF does not calculate totals or sync with the app.",
        },
        {
          kind: "paragraph",
          text: "Print at actual size or choose fit to printable area if your printer clips the margins. The sheet uses black text on white paper and works in grayscale. Print page one for detailed sessions and page two once a week, or use just the weekly page when you want a lighter record.",
        },
      ],
    },
    {
      heading: "What to Write in Your Guitar Practice Journal",
      blocks: [
        {
          kind: "list",
          items: [
            "**A specific goal:** replace 'get better at chords' with 'change from Am to C for eight bars without stopping'.",
            "**The exact material:** write the exercise, song section or scale position so you can repeat it tomorrow.",
            "**Minutes actually spent:** record the session you did, even when it was shorter than planned.",
            "**A comparable result:** for a metronome drill, note BPM and subdivision; for bends, note pitch accuracy; for repertoire, note whether you finished without restarting.",
            "**One next step:** choose a small action, such as repeating the same tempo with quieter unused strings.",
          ],
        },
        {
          kind: "tip",
          title: "Tempo needs context",
          text: "Eighth notes at 80 BPM and sixteenth notes at 80 BPM are different tasks. Keep the exercise, subdivision and success criterion the same when comparing sessions. A faster number with extra noise is not evidence that the same task improved.",
        },
        {
          kind: "paragraph",
          text: "Use the [daily guitar practice plan](/daily-guitar-practice-plan) if you need something to put in the exercise rows. Its printable routines cover 15, 30 and 60 minutes. For a focused lead session, use the [scale routine and PDF](/guitar-scale-practice-routine).",
        },
      ],
    },
    {
      heading: "A Filled-In Guitar Practice Log Example",
      blocks: [
        {
          kind: "paragraph",
          text: "Here is an example of a 30-minute session, not a required tempo target. The goal is to keep unused strings quiet and play a short song section without restarting. Pick tempos you can control.",
        },
        {
          kind: "schedule",
          schedule: {
            columns: ["Block", "Minutes", "Result to record"],
            rows: [
              ["Slow warm-up", "5", "Comfortable movement; no tempo target"],
              [
                "Single-string muting",
                "10",
                "60 BPM, eighth notes; four clean bars, then noise on the string change",
              ],
              [
                "Vibrato control",
                "7",
                "Three held notes with even pulses; third note still uneven",
              ],
              [
                "Song: verse, bars 1-8",
                "8",
                "Two complete passes at a slower tempo; no restarts",
              ],
            ],
          },
        },
        {
          kind: "paragraph",
          text: "The next-step note could read: 'Repeat the muting drill at 60 BPM, isolate the string change, then reconnect the four bars.' That instruction is more useful tomorrow than 'practice harder'. For more ways to compare recordings and session history, read [how to track guitar practice progress](/blog/how-to-track-guitar-practice-progress-effectively).",
        },
      ],
    },
    {
      heading: "Turn Your Weekly Review Into a Plan",
      blocks: [
        {
          kind: "paragraph",
          text: "At the end of the week, read the seven-session page and choose one result worth keeping, one recurring difficulty and one priority for next week. Blank days are information about the schedule, not a reason to invent sessions. If you planned an hour but repeatedly found fifteen minutes, start next week with the shorter routine.",
        },
        {
          kind: "list",
          items: [
            "Keep one drill unchanged so the next result is comparable.",
            "Change one variable at a time: tempo, difficulty or duration.",
            "Listen to a short recording of the same passage when possible. Write what you hear rather than relying only on how the session felt.",
            "Finish the review by naming the first exercise for your next session.",
          ],
        },
        {
          kind: "paragraph",
          text: "If you already have comfortable chord changes and basic scale vocabulary, the [intermediate guitar practice routine](/intermediate-guitar-practice-routine) supplies a 45-minute session and weekly rotation to pair with this journal. Beginners can start with the [beginner exercises and practice sheet](/beginner-guitar-exercises).",
        },
      ],
    },
    {
      heading: "Paper Journal or Digital Guitar Practice Log?",
      blocks: [
        {
          kind: "paragraph",
          text: "Paper works well when you want a screen-free session and room for your own shorthand. A digital log is useful when you want session history available across devices. Choose the format you will actually update; keeping both is optional.",
        },
        {
          kind: "paragraph",
          text: "The digital side can also do the adding up for you. A [guitar progress tracker](/features/guitar-progress-tracker) turns each logged session into time per category, a streak, points and skills, so the weekly review starts from numbers instead of memory.",
        },
        {
          kind: "paragraph",
          text: "With a free Riff Quest account you can record a session in the app and review your practice history. The printable journal stays separate: handwritten notes are not imported automatically. You can also [build a practice plan](/guitar-practice-planner) before the session and keep the PDF beside your guitar.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Is this guitar practice journal PDF free?",
      answer:
        "Yes. Download and print it without creating an account or providing an email address. A Riff Quest account is optional for digital session logging.",
    },
    {
      question:
        "What is the difference between a practice log and a practice routine?",
      answer:
        "A routine tells you what to play and for how long. A log records what you actually played and what happened. Use a routine to start the session and a journal to decide what to repeat or change next time.",
    },
    {
      question: "Should I track BPM for every exercise?",
      answer:
        "No. Tempo is useful for repeatable timing and technique drills. For ear training, bends or song performance, a result such as naming the interval, reaching the target pitch or completing a section may be more useful.",
    },
    {
      question: "Can I type into the PDF or sync it with Riff Quest?",
      answer:
        "This is a printable worksheet, not an interactive form. Fill it in by hand or annotate it in a PDF reader. Its notes do not sync with the app.",
    },
  ],
  relatedGuideSlugs: [
    "beginner-guitar-exercises",
    "daily-guitar-practice-plan",
    "guitar-scale-practice-routine",
    "guitar-speed-hand-synchronization-exercises",
    "intermediate-guitar-practice-routine",
  ],
  relatedBlogSlugs: ["how-to-track-guitar-practice-progress-effectively"],
  relatedSongGuideSlugs: [],
};
