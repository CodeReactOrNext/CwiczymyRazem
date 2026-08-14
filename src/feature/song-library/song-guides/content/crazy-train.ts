import { crazyTrainRiffPreviewExercise } from "feature/exercisePlan/data/exerises/crazyTrainRiffPreview/crazyTrainRiffPreview";

import type { SongGuide } from "../types";

export const crazyTrain: SongGuide = {
  slug: "crazy-train",
  songId: "OLQsRdKrPMgz8ZPO86oU",
  title: "Crazy Train",
  artist: "Ozzy Osbourne",
  author: "Michael Apfel",
  publishedAt: "2026-08-06",
  updatedAt: "2026-08-06",
  seo: {
    metaTitle: "Crazy Train Guitar Difficulty: Real Data | Riff Quest",
    metaDescription:
      "How hard is Crazy Train on guitar? The Randy Rhoads riff is beginner-friendly, but the tapping-and-legato solo is a genuine shred exam — real tempo, key, and technique data inside.",
    keywords: [
      "crazy train guitar difficulty",
      "how hard is crazy train",
      "crazy train riff guitar",
      "crazy train guitar bpm",
      "crazy train solo guitar",
      "learn crazy train guitar",
      "randy rhoads guitar technique",
    ],
  },
  h1: "Crazy Train on Guitar: How Hard Is It Really?",
  quickAnswer:
    "The gallop riff is beginner-friendly — the real test is the tapping, legato, and pinch-harmonic solo Randy Rhoads built on top of it.",
  intro: [
    "Crazy Train is one of the most common 'first real riff' songs in rock guitar, and for good reason: strip away the siren-like intro effect and what's left is a driving, palm-muted pattern anchored on one open string, well within reach of an early-intermediate player. That accessibility is exactly why the song shows up on so many beginner playlists.",
    "It's also why so many of those same players hit a wall a minute later. Randy Rhoads was classically trained before he was a metal guitarist, and his solo on this track — tapped intro, fast legato runs, screaming pinch harmonics, blues-informed bends — is a genuine technical showcase that has almost nothing in common with the riff that got you in the door. This guide separates the two halves honestly instead of averaging them into one misleading number.",
  ],
  facts: [
    { label: "Artist", value: "Ozzy Osbourne (Blizzard of Ozz, 1980)" },
    { label: "Tuning", value: "E standard" },
    { label: "Key", value: "A (riff), F# minor (solo)" },
    { label: "Tempo", value: "≈136 BPM" },
    { label: "Length", value: "4:52" },
  ],
  lookup: {
    bpm: 136,
    tuning: "E standard",
  },
  editorial: {
    difficulty: 7,
    timeToLearn: "2–4 weeks for the riff; 3–6 months for the full solo",
    oneLiner:
      "A beginner-friendly gallop riff that hides one of rock's most advanced guitar solos right behind it.",
  },
  verdict: {
    heading: "The verdict: an easy riff guarding a genuinely hard solo",
    paragraphs: [
      "On the Riff Quest ladder, Crazy Train lands mid-to-upper intermediate territory (the tier badge above shows exactly where today's community rating sits), and that single number hides a real split. The main riff — a palm-muted pattern pinned to an open low string, shifting shape as the chords change underneath — is genuinely approachable. Most players with a few months of rhythm guitar under their belt can get it sounding correct within a couple of weeks.",
      "The solo is a different song entirely. Randy Rhoads studied classical guitar before joining Ozzy's band, and it shows: the solo opens with two-hand tapping in the Van Halen mold, moves into fast legato runs built from hammer-ons and pull-offs, throws in screaming pinch harmonics for punctuation, and closes out with blues-rooted bends and vibrato. None of it is beginner material, and none of it is optional if your goal is the full song rather than the part everyone already recognizes.",
      "That gap between 'anyone can learn the riff' and 'the solo is an advanced-player benchmark' is the whole story of this song's difficulty rating, and it's why the timeline below treats them as two separate projects rather than one.",
    ],
  },
  whoFor: {
    heading: "Should you attempt it yet?",
    ready: [
      "You can palm-mute a repeating single-note pattern cleanly at a driving tempo without the muted notes bleeding into open ones.",
      "You already know basic hammer-ons and pull-offs and want a real song to push that into legato territory.",
      "You're specifically looking for a tapping-and-legato solo to grow into, not just another riff.",
    ],
    notYet: [
      "You've never palm-muted a picking pattern before; build that on a slower riff first, or the gallop will sound mushy no matter how fast you play it.",
      "You expect the solo to click as fast as the riff does; it's a separate, months-long project layered on top of an easy first half.",
      "Pinch harmonics still feel like luck rather than a repeatable technique; that's worth isolating on its own before you chase it inside a fast solo.",
    ],
  },
  techniques: {
    heading: "The skills under the hood",
    intro:
      "The riff and the solo barely share a skill set. Both get trained here, split by how essential they are to owning the song.",
    items: [
      {
        name: "Pedal-tone gallop riff",
        difficulty: 3,
        role: "core",
        description:
          "A repeating pattern anchored on one muted open string with fretted notes moving on top, shifted up the neck as the chords change. Approachable once the muting is solid.",
      },
      {
        name: "Palm muting & rhythm precision",
        difficulty: 3,
        role: "core",
        description:
          "The riff's whole groove depends on a tight, consistent mute on the pedal note contrasted against clearer accents. Loose muting is the #1 reason a correct riff still sounds wrong.",
      },
      {
        name: "Legato runs (hammer-ons & pull-offs)",
        difficulty: 5,
        role: "core",
        description:
          "The backbone of Rhoads' solo phrasing: fast, fluid runs played mostly with the fretting hand for a smoother, more liquid sound than picking every note.",
      },
      {
        name: "Two-hand tapping (solo intro)",
        difficulty: 5,
        role: "bonus",
        description:
          "The solo opens with a burst of right-hand tapping combined with left-hand hammer-ons and pull-offs, the same vocabulary Eddie Van Halen popularized a few years earlier.",
      },
      {
        name: "Pinch harmonics",
        difficulty: 4,
        role: "bonus",
        description:
          "Squealing accent notes produced by grazing the picking-hand thumb against the string right after picking. A specific hand-position skill worth isolating before chasing it at speed.",
      },
      {
        name: "Blues-style bends & vibrato",
        difficulty: 3,
        role: "core",
        description:
          "The solo's closing phrases lean on expressive, vocal-like bends and vibrato — the most immediately learnable part of the solo for players coming from blues-rock.",
      },
    ],
  },
  songMap: {
    heading: "Song map: where the difficulty actually lives",
    intro:
      "Six sections, one enormous jump in the middle. Learn the riff-based sections as a group, then treat the solo as its own project.",
    sections: [
      {
        name: "Siren intro",
        difficulty: 1,
        description:
          "A studio sound effect, not a guitar part — there's nothing to play until the alarm fades and the band comes in on the riff.",
      },
      {
        name: "Main riff",
        difficulty: 4,
        description:
          "The pedal-tone gallop pattern that defines the song. All palm-muted picking on an open string with fretted notes layered on top; comfortable once the muting locks in.",
      },
      {
        name: "Verse riff",
        difficulty: 3.5,
        description:
          "A close variation on the main riff under the vocal. Slightly sparser, and a good confidence-builder once the intro riff is solid.",
      },
      {
        name: "Pre-chorus / bridge",
        difficulty: 4,
        description:
          "Quick chord stabs and a shift in feel before the chorus. Still comfortably in riff territory, no new technique required.",
      },
      {
        name: "Randy Rhoads guitar solo",
        difficulty: 8.5,
        isHardest: true,
        description:
          "Tapped intro, fast legato runs, pinch harmonics, and blues-rooted bends, all stitched into one continuous statement. This section alone is why the song rates as high as it does.",
      },
      {
        name: "Outro riffing",
        difficulty: 4,
        description:
          "The main riff returns for the finish. Nothing new technically, but a real test of whether the groove is still tight after the solo.",
      },
    ],
    hardestSummary:
      "Every riff-based section in this song is learnable inside a few weeks by an early-intermediate player. The solo is a genuinely different skill level: tapping, fast legato, and pinch harmonics stacked into one 30-second passage, and it's the entire reason this song outranks most other 'first real riff' songs on difficulty.",
  },
  riffPreview: {
    heading: "Riff preview",
    intro: "A short tab from the song's main gallop riff.",
    measures: crazyTrainRiffPreviewExercise.tablature!,
    bpm: crazyTrainRiffPreviewExercise.metronomeSpeed!.recommended,
    bpmMin: crazyTrainRiffPreviewExercise.metronomeSpeed!.min,
    bpmMax: crazyTrainRiffPreviewExercise.metronomeSpeed!.max,
    practiceExerciseId: crazyTrainRiffPreviewExercise.id,
  },
  timeline: {
    heading: "Realistic timelines",
    intro:
      "The riff and the solo belong on two different clocks. Treat them that way and the song stops feeling like a moving target.",
    entries: [
      {
        level: "Beginner (under 1 year)",
        time: "1–2 months for the riff only",
        note: "A great early 'real song' goal. Leave the solo for later; there's no shame in playing the riff-based sections and skipping straight to the next verse on record.",
      },
      {
        level: "Intermediate (1–3 years)",
        time: "2–4 weeks for the riff; 3–6 months for the full solo",
        note: "The riff clicks fast. The solo is where the real practice time goes — tapping accuracy and legato speed build gradually, not overnight.",
      },
      {
        level: "Advanced",
        time: "Days for the riff; a few weeks for a faithful solo",
        note: "Notes arrive quickly for an experienced player; the real project is matching Rhoads' phrasing and tone, not just hitting the right frets.",
      },
    ],
  },
  practicePlan: {
    heading: "The training plan",
    intro:
      "Front-load the riff so you have a performable version fast, then treat the solo as a separate multi-week project.",
    steps: [
      "Week 1: learn the main riff and verse riff slow, metronome on, with total focus on clean palm muting before adding any speed.",
      "Week 2: bring the riff sections up to ≈136 BPM and chain them into a full run-through of everything except the solo.",
      "Weeks 3–4: start the solo phrase by phrase — tapped intro first in isolation, then the opening legato run, both well under tempo.",
      "Weeks 4–8: add pinch harmonics as their own drill (isolated on a single sustained note before dropping them into the solo), then work the closing bends for pitch accuracy.",
      "Months 2–6: stitch the full solo together at climbing tempo, benchmark it weekly, and log the BPM where the legato runs start breaking down.",
    ],
  },
  learningPath: {
    heading: "The road to Crazy Train, and past it",
    intro:
      "The riff is an early win almost anyone can reach quickly. The solo is a longer climb — here's what leads in and what comes next.",
    easier: [
      {
        title: "Iron Man",
        artist: "Black Sabbath",
        difficulty: 4,
        why: "Ozzy's other iconic riff, and a gentler introduction to the same driving, muted eighth-note feel.",
      },
      {
        title: "Enter Sandman",
        artist: "Metallica",
        difficulty: 5.5,
        why: "Builds the same tight palm-muting and steady picking-hand rhythm the Crazy Train riff depends on.",
        songId: "htHQ0wEmYlGtuSS9xoBY",
      },
      {
        title: "Thunderstruck",
        artist: "AC/DC",
        difficulty: 6,
        why: "Trains raw picking-hand speed and precision on a single string — the same right-hand stamina Crazy Train's riff and solo both draw on.",
        guideSlug: "thunderstruck",
        songId: "bFniERauZnH1az68JY6S",
      },
    ],
    harder: [
      {
        title: "Sweet Child O' Mine",
        artist: "Guns N' Roses",
        difficulty: 7.5,
        why: "Another song where an approachable riff hides a full-length guitar-hero solo — this time built on string-skipping precision instead of tapping.",
        guideSlug: "sweet-child-o-mine",
        songId: "U79ddvoBhbUXD3JtBXik",
      },
      {
        title: "Master of Puppets",
        artist: "Metallica",
        difficulty: 8.5,
        why: "A different axis of difficulty entirely: instead of one flashy solo, it's eight minutes of relentless downpicking stamina.",
        guideSlug: "master-of-puppets",
        songId: "KwZ17fUDZNnEw32VM6mS",
      },
      {
        title: "Eruption",
        artist: "Van Halen",
        difficulty: 9.5,
        why: "The tapping and legato vocabulary Crazy Train's solo introduces, taken to its purest and most extreme form.",
      },
    ],
  },
  relatedLandingSlugs: ["speed", "intermediate"],
  progression: {
    heading: "Where it sits on the ladder",
    description:
      "Crazy Train sits mid-to-upper intermediate on the Riff Quest ladder (the badge above shows exactly where today's community rating lands it) — pulled up almost entirely by its solo. As a riff-only song it would rate far lower; as a complete performance including the tapping, legato, and pinch harmonics, it's a legitimate stepping stone toward full 80s-shred repertoire.",
  },
  inlineCta: {
    heading: "Split it into two real goals",
    text: "Riff Quest lets you track the riff and the solo as separate quests: bank an early win on the gallop pattern this week, then chip away at the tapping and legato runs as their own multi-month project.",
  },
  finalCta: {
    headingTop: "All aboard,",
    headingAccent: "one section at a time.",
    text: "Add Crazy Train to your list, track the riff and the solo as separate goals, and let community difficulty data show you exactly what's next.",
  },
  faq: [
    {
      title: "How hard is Crazy Train on guitar?",
      message:
        "Crazy Train currently rates {{difficulty}}/10 on Riff Quest's community difficulty scale ({{tier}}). That number is pulled up almost entirely by the solo — the riff-based sections on their own would rate considerably lower, comfortably within reach of an early-intermediate player.",
    },
    {
      title: "Is the Crazy Train solo tapped?",
      message:
        "Partly. Randy Rhoads opens the solo with a burst of two-hand tapping in the same vocabulary Eddie Van Halen made famous, then moves into fast legato runs (hammer-ons and pull-offs without tapping), pinch harmonics, and blues-style bends. It's a mix of techniques, not one trick repeated throughout.",
    },
    {
      title: "What key is Crazy Train in?",
      message:
        "The main riff and verses sit in A, while the guitar solo is built around F# minor (its relative minor) using the Aeolian mode with a couple of chromatic exceptions. That shift is part of why the solo feels like a different piece of music from the riff around it.",
    },
    {
      title: "What BPM is Crazy Train?",
      message:
        "Around 136 BPM on the studio recording, though automated tempo tools sometimes read it a beat or two off in either direction. For practice, start the riff well under tempo (60–70% is plenty to start) and climb gradually with a metronome.",
    },
    {
      title: "Can a beginner play Crazy Train?",
      message:
        "The riff, yes — it's one of the more common early 'real song' goals for exactly that reason. The full solo is not a beginner project; most players spend months building the legato speed, tapping accuracy, and pinch-harmonic control it demands, and it's completely reasonable to play the song's riff sections and set the solo aside until later.",
    },
    {
      title: "What's that siren sound at the start of the song?",
      message:
        "It's a studio sound effect layered in before the band comes in, not a guitar part — there's nothing to learn there. The actual riff starts once the alarm-like effect fades and the palm-muted gallop pattern kicks in.",
    },
  ],
  customBlocks: [
    {
      kind: "patternBreakdown",
      id: "riff-anatomy",
      heading: "Anatomy of the gallop riff",
      intro:
        "One pedal note, a handful of fretted notes on top, and a muting contrast that makes the whole thing groove. Break it into these pieces and it stops feeling like a wall of notes.",
      steps: [
        {
          label: "1. The pedal note",
          description:
            "An open low string, palm-muted, repeated throughout the pattern as the rhythmic anchor. Get this feeling locked and steady before worrying about anything else.",
        },
        {
          label: "2. The fretted notes on top",
          description:
            "A short run of fretted notes played between repetitions of the pedal note — these carry the melody of the riff while the pedal note keeps the pulse.",
        },
        {
          label: "3. The muting contrast",
          description:
            "The pedal note stays tightly muted while the fretted notes ring out a little more openly. That contrast, not the notes themselves, is what makes the riff sound like the record instead of a flat picking exercise.",
        },
        {
          label: "4. Shifting under the chord changes",
          description:
            "The same shape moves to follow the underlying chords as the riff progresses into the verse and pre-chorus. Once the base pattern is automatic, the rest of the song's rhythm parts fall into place quickly.",
        },
      ],
    },
  ],
  sources: [
    {
      label: "Randy Rhoads' technique and classical influence: Guitar Player",
      url: "https://www.guitarplayer.com/lessons/randy-rhoads-the-magical-techniques-of-the-wizard-of-ozz",
    },
    {
      label: "Crazy Train: song facts, tempo, and personnel — Wikipedia",
      url: "https://en.wikipedia.org/wiki/Crazy_Train",
    },
  ],
  videoLessons: [
    {
      videoId: "61YCfNHZuHE",
      title:
        "Crazy Train Guitar Lesson - Ozzy Osbourne - Opening Riff - How to Play on Guitar",
      channelName: "Marty Music",
    },
    {
      videoId: "y_zpUFPiCGU",
      title:
        "Ozzy Osbourne - Crazy Train - Guitar Tab | Lesson | Cover | Tutorial | Remake",
      channelName: "Mr. Tabs",
    },
    {
      videoId: "ifujL3F6DX8",
      title: "Crazy Train Solo Guitar Lesson + Tutorial",
      channelName: "TomShreds",
    },
  ],
  sectionOrder: [
    "riffPreview",
    "videoLessons",
    "verdict",
    "songMap",
    "custom:riff-anatomy",
    "whoFor",
    "techniques",
    "timeline",
    "inlineCta",
    "practicePlan",
    "learningPath",
    "progression",
    "sources",
    "relatedExercises",
  ],
};
