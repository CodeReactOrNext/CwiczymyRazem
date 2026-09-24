import type { SongGuide } from "../types";

export const everlong: SongGuide = {
  slug: "everlong",
  songId: "tiOJ5Mqg8TsCZ0Cuuh1D",
  title: "Everlong",
  artist: "Foo Fighters",
  author: "Michael Apfel",
  publishedAt: "2026-09-24",
  updatedAt: "2026-09-24",
  seo: {
    metaTitle: "Everlong Guitar Difficulty: Drop D & Strumming | Riff Quest",
    metaDescription:
      "How hard is Everlong on guitar? Community difficulty data, why drop D and ringing open strings make the chords easy, the 158 BPM strumming stamina, and a tempo ladder to full speed.",
    keywords: [
      "everlong guitar difficulty",
      "how to play everlong",
      "everlong drop d",
      "everlong chords",
      "everlong bpm",
      "everlong strumming",
      "foo fighters guitar songs",
    ],
  },
  h1: "Everlong on Guitar: Drop D, Open Strings, No Rest",
  quickAnswer:
    "Drop D makes the chord shapes surprisingly easy; the challenge is strumming them evenly at about 158 BPM for four minutes without letting the open strings turn to noise.",
  intro: [
    "Dave Grohl wrote Everlong in about 45 minutes, in drop D tuning, and described the original riff as a Sonic Youth rip-off inspired by their song Schizophrenia. It became the Foo Fighters' signature song and one of the most-added songs in the Riff Quest library. For guitarists it is a strange mix: the fretting hand does surprisingly little, while the strumming hand barely gets a moment's rest.",
    "The secret is the tuning. With the low E string dropped to D, the chords are built from simple shapes on the lower strings while open strings ring above them. As the shapes move, those open strings stay put, creating the shimmering, slightly dissonant sound that makes the song instantly recognisable. That part is easy to fret. The hard part is strumming it at around 158 BPM, evenly and relaxed, for over four minutes. This guide covers both.",
  ],
  facts: [
    { label: "Artist", value: "Foo Fighters (The Colour and the Shape, 1997)" },
    { label: "Tuning", value: "Drop D" },
    { label: "Tempo", value: "≈158 BPM" },
    { label: "Written", value: "In about 45 minutes, per Grohl" },
    { label: "Length", value: "4:10" },
  ],
  lookup: {
    bpm: 158,
    tuning: "Drop D",
  },
  editorial: {
    difficulty: 5,
    timeToLearn: "A few days for the shapes; 1-2 months to full speed",
    oneLiner:
      "Easy drop-D shapes with ringing open strings, strummed at a pace that makes it a real stamina song.",
  },
  verdict: {
    heading: "The verdict: easy for the left hand, hard for the right",
    paragraphs: [
      "Everlong sits in the middle of the Riff Quest ladder, and the split between the two hands explains why. The fretting hand plays a handful of shapes on the low strings, with the tuning doing much of the work. Many of the chords need only one or two fingers.",
      "The strumming hand carries the song. At about 158 BPM, the fast, even strum runs almost without pause through verse and chorus. Keeping it steady and relaxed for four minutes is a real stamina challenge, and the open strings make any unevenness or rushing easy to hear.",
      "There is also a quieter bridge, where the band drops back before the song builds up again. Handling that change in dynamics, and getting back up to full intensity on time, is the main musical skill beyond the strumming.",
    ],
  },
  whoFor: {
    heading: "Is this your song right now?",
    ready: [
      "You can strum eighth notes steadily at 120 BPM or more.",
      "You are comfortable retuning to drop D.",
      "You want a fast song where the challenge is endurance rather than tricky chords.",
      "You like songs that sound big with just one guitar.",
    ],
    notYet: [
      "You have not yet strummed at fast tempos; build up on Smells Like Teen Spirit or Paranoid first.",
      "Your strumming hand tenses up quickly; practise relaxed strumming at slower tempos first.",
      "You want a song with a solo; Everlong is almost entirely rhythm guitar.",
    ],
  },
  techniques: {
    heading: "The skills under the hood",
    intro:
      "Only one item on this list is about the fretting hand. The rest belong to the strumming hand.",
    items: [
      {
        name: "Drop D shapes",
        difficulty: 2,
        role: "core",
        description:
          "Chord shapes on the lowest strings, easy to fret thanks to the tuning. Often only one or two fingers are needed.",
      },
      {
        name: "Letting open strings drone",
        difficulty: 3,
        role: "core",
        description:
          "The higher strings ring open above the moving shapes. They must sound clearly, which means no accidental muting by the fretting fingers.",
      },
      {
        name: "Fast, even strumming",
        difficulty: 5,
        role: "core",
        description:
          "Steady strumming at about 158 BPM. The core skill of the song, and the one that takes longest.",
      },
      {
        name: "Strumming endurance",
        difficulty: 5,
        role: "core",
        description:
          "Keeping the same speed and evenness for over four minutes. Tension is what stops most players.",
      },
      {
        name: "Dynamics in the bridge",
        difficulty: 3,
        role: "core",
        description:
          "Dropping back for the quiet bridge and building back up to full intensity on time.",
      },
    ],
  },
  songMap: {
    heading: "Song map: fast and steady, with one breath",
    intro:
      "The song's difficulty is flat, except that it keeps getting harder to sustain.",
    sections: [
      {
        name: "Intro",
        difficulty: 4,
        description:
          "The main drop-D shapes with ringing open strings. Set a relaxed strumming motion from the first bar.",
      },
      {
        name: "Verse",
        difficulty: 4.5,
        description:
          "The same fast strumming under the vocal. Keep the open strings ringing without letting the strum get louder and faster.",
      },
      {
        name: "Chorus",
        difficulty: 5,
        description:
          "Bigger and louder. The main risk is rushing as the intensity increases.",
      },
      {
        name: "Quiet bridge",
        difficulty: 4,
        description:
          "The band drops back. A welcome break for the strumming hand, and a test of dynamic control.",
      },
      {
        name: "Final choruses",
        difficulty: 5.5,
        isHardest: true,
        description:
          "Back to full intensity after the bridge, with fatigue setting in. The hardest part is simply keeping going cleanly.",
      },
    ],
    hardestSummary:
      "No single section is technically hard. The difficulty is cumulative: the final choruses are hard because of the minutes of strumming before them.",
  },
  timeline: {
    heading: "How long will it actually take?",
    intro: "At 20-30 minutes a day, mostly spent building strumming speed.",
    entries: [
      {
        level: "Beginner with steady strumming",
        time: "1-2 months",
        note: "The shapes take days. Reaching 158 BPM relaxed takes weeks of gradual practice.",
      },
      {
        level: "Early intermediate",
        time: "2-4 weeks",
        note: "If you already strum at 130-140 BPM, the last steps to full speed come quickly.",
      },
      {
        level: "Intermediate and up",
        time: "An evening",
        note: "The shapes and structure are quick. Playing the whole song cleanly twice in a row is the real test.",
      },
    ],
  },
  practicePlan: {
    heading: "The practice plan",
    intro:
      "Learn the shapes in a day, then spend the rest of your time on the strumming hand.",
    steps: [
      "Before you start: tune the low E string down to D and check it against the open D string.",
      "Session 1: the main shapes slowly, strumming each one and checking that every open string rings.",
      "Week 1: the tempo ladder below, starting at 110 BPM, only moving up when a two-minute block feels easy.",
      "Weeks 2-4: 130 to 158 BPM, including the switch into and out of the quiet bridge.",
      "After that: the whole song with the record, twice in a row, without tensing up.",
    ],
  },
  learningPath: {
    heading: "Before and after Everlong",
    intro:
      "Songs either side of it, built around strumming stamina and alternate tunings.",
    easier: [
      {
        title: "Come As You Are",
        artist: "Nirvana",
        difficulty: 3.5,
        why: "An alternate tuning and a hypnotic riff at a slower tempo: Grohl's previous band.",
        guideSlug: "come-as-you-are",
        songId: "UgfElrEYe13NL5NmbPvo",
      },
      {
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        difficulty: 4,
        why: "Continuous strumming at a more moderate tempo: good preparation for Everlong's speed.",
        guideSlug: "smells-like-teen-spirit",
        songId: "A6PRUg5o6b0tqBcXfLMi",
      },
    ],
    harder: [
      {
        title: "Paranoid",
        artist: "Black Sabbath",
        difficulty: 4.5,
        why: "Another speed test, this time with picked power chords at an even faster tempo.",
        guideSlug: "paranoid",
        songId: "jrR6henxrPj3ubuFFqS4",
      },
      {
        title: "Seek & Destroy",
        artist: "Metallica",
        difficulty: 5.5,
        why: "Endurance again, with downpicked riffs over a longer song.",
        guideSlug: "seek-and-destroy",
        songId: "6asNDl20fZXuM2osTZMN",
      },
      {
        title: "Hysteria",
        artist: "Muse",
        difficulty: 8,
        why: "The long-term goal for fast, relentless picking: far more demanding than Everlong.",
        songId: "0h5dqmACziz1mjrIzq4r",
      },
    ],
  },
  relatedLandingSlugs: ["speed", "daily"],
  progression: {
    heading: "Where it sits on the ladder",
    description:
      "Everlong sits in the middle of the Riff Quest ladder (the badge above shows the current community rating). It is one of the best songs for building strumming stamina, because the chords stay out of the way and let you focus completely on the strumming hand. Faster rock and punk songs above it on the ladder rely on that endurance.",
  },
  inlineCta: {
    heading: "Watch the BPM climb",
    text: "Riff Quest tracks your tempo on every session. Log Everlong at each step of the ladder and watch your comfortable strumming speed rise week by week.",
  },
  finalCta: {
    headingTop: "Drop D, open strings,",
    headingAccent: "and four minutes that never let up.",
    text: "Add Everlong to your list, climb the tempo ladder, and let community difficulty data pick your next stamina song.",
  },
  faq: [
    {
      title: "How hard is Everlong on guitar?",
      message:
        "Everlong currently rates {{difficulty}}/10 on Riff Quest's community difficulty scale ({{tier}}). The drop-D chord shapes are easy; the challenge is strumming evenly at about 158 BPM for the whole song.",
    },
    {
      title: "What tuning is Everlong in?",
      message:
        "Drop D: D A D G B E. Only the low E string is tuned down a whole step to D. Dave Grohl was using this tuning when he first came up with the riff.",
    },
    {
      title: "What BPM is Everlong?",
      message:
        "About 158 BPM. Build up to it gradually with a metronome rather than trying to play at full speed straight away.",
    },
    {
      title: "Why does Everlong sound so big with one guitar?",
      message:
        "Because of the open strings. The higher strings ring open above the moving chord shapes, so each chord includes a constant drone. That creates the song's shimmering, full sound.",
    },
    {
      title: "Is the acoustic version of Everlong easier?",
      message:
        "It uses the same tuning and shapes but a gentler, more flexible feel, which many players find easier on the strumming hand. It is a good way to learn the song before tackling the full-speed band version.",
    },
    {
      title: "How was Everlong written?",
      message:
        "Dave Grohl wrote it in about 45 minutes while staying at a friend's house. He described the original riff as a Sonic Youth rip-off inspired by their song Schizophrenia.",
    },
  ],
  sources: [
    {
      label:
        "Everlong: Wikipedia (drop D, 45-minute writing, Sonic Youth influence, The Colour and the Shape)",
      url: "https://en.wikipedia.org/wiki/Everlong",
    },
  ],
  videoLessons: [
    {
      videoId: "8SdCgWgP_TI",
      title:
        "The Foo Fighters - Everlong Guitar Lesson - How to Play on Guitar - Dave Grohl",
      channelName: "Marty Music",
    },
    {
      videoId: "nwjTdp6VYyc",
      title:
        "How to play 'Everlong' by Foo Fighters (in Drop D) (electric guitar lesson tutorial - shigaru.com)",
      channelName: "shigarututor",
    },
    {
      videoId: "pn12DsoVHrg",
      title: "Foo Fighters - Everlong - Guitar Tab | Lesson | Cover | Tutorial",
      channelName: "Mr. Tabs",
    },
  ],
  customBlocks: [
    {
      kind: "patternBreakdown",
      id: "drone-shapes",
      heading: "How the drop-D drone shapes work",
      intro:
        "Understanding why the chords sound the way they do makes them much easier to learn and remember.",
      steps: [
        {
          label: "1. The dropped low string",
          description:
            "With the low E tuned down to D, the lowest strings form a power chord under a single finger or a very simple shape.",
        },
        {
          label: "2. Moving shapes below",
          description:
            "The chord changes happen on those lower strings. The fretting hand moves small shapes up and down the neck.",
        },
        {
          label: "3. Open strings above",
          description:
            "The higher strings are left open and keep ringing as the shapes move. They form a constant drone above the changing bass.",
        },
        {
          label: "4. The shimmer",
          description:
            "Because the open strings stay the same while the shapes move, some chords sound slightly dissonant. That shimmering clash is the sound of the song, not a mistake.",
        },
      ],
    },
    {
      kind: "tempoLadder",
      id: "strum-ladder",
      heading: "Strumming ladder: 110 to 158 BPM",
      intro:
        "Each step is a two-minute block. Move up only when the block feels relaxed and every open string is still ringing.",
      steps: [
        {
          bpm: "110",
          goal: "Main shapes with steady strumming. Check that the open strings ring in every chord.",
        },
        {
          bpm: "125",
          goal: "Verse and chorus together, with a relaxed wrist.",
        },
        {
          bpm: "140",
          goal: "The first real stamina test. Stay here until two minutes feel easy.",
        },
        {
          bpm: "150",
          goal: "Include the quiet bridge and the build back to full intensity.",
        },
        {
          bpm: "158",
          goal: "The whole song along with the record, twice in a row, without tensing or rushing.",
        },
      ],
    },
  ],
  sectionOrder: [
    "custom:drone-shapes",
    "verdict",
    "videoLessons",
    "songMap",
    "custom:strum-ladder",
    "techniques",
    "whoFor",
    "timeline",
    "practicePlan",
    "inlineCta",
    "learningPath",
    "progression",
    "sources",
    "relatedExercises",
  ],
};
