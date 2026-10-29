import {
  COMPLETION_FAME_REWARD,
  THANKS_FAME_REWARD,
} from "feature/communityExercises/types";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing that tells four tools as one story: bring material (GP Tabs,
 * the Tab Editor), make it an exercise (own exercises), play it with a band
 * (backing tracks), and share it (the community tab).
 *
 * Intent: "I have my own tab / Guitar Pro file — can I practise it properly?"
 * The interactive practice landing shows the session itself; this one is about
 * whose material goes into it.
 */
export const OWN_MATERIAL_META = {
  slug: "features/guitar-tab-editor",
  eyebrow: "Your own material",
  title: "Turn any tab into an exercise, and never play it alone",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Tab Editor and Guitar Pro Practice | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Write a tab or upload a Guitar Pro file, turn it into an exercise with tempo and note detection, and play it over a backing band. Share it if you like.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/guitar-tab-editor/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

/** The editor itself needs no account; saving an exercise does. */
export const OWN_MATERIAL_ROUTES = {
  editor: "/tab-editor",
  gpTabs: signupThen("/gp-tabs"),
  myExercises: signupThen("/my-exercises"),
} as const;

export type OwnMaterialTarget = keyof typeof OWN_MATERIAL_ROUTES;

/** The library exercise whose first bars the hero writes and backs. */
export const OWN_MATERIAL_SHOWCASE_EXERCISE = "string_skipping_melodic";
/** Bars of it the hero plays: the whole exercise, so the loop is the real one. */
export const OWN_MATERIAL_SHOWCASE_BARS = 4;

/**
 * Counted in Firestore on 2026-10-29 (communityExercises, users/x/gpFiles)
 * and rounded down to the ten, so the page never overstates what exists.
 */
export const OWN_MATERIAL_FACTS = {
  countedAt: "2026-10-29",
  exercisesWritten: 190,
  authors: 40,
  gpFilesUploaded: 830,
} as const;

/** Public community exercises with the most plays on the day of counting. */
export const OWN_MATERIAL_BOARD = [
  { title: "7 day RIFF speed building routine", plays: 24, thanks: 3 },
  { title: "Am Alternate Picking exercise", plays: 24, thanks: 2 },
  { title: "Spider Pendulum 8 Note", plays: 4, thanks: 2 },
  { title: "1+3 Legato Hammer On Lvl 1", plays: 3, thanks: 2 },
] as const;

/**
 * The Guitar Pro library's limits. Copied rather than imported: their modules
 * pull in alphaTab and the Firebase client, which a landing page must not
 * ship. The test checks them against gp5Parser / userGpFiles.
 */
export const OWN_MATERIAL_GP_LIMITS = {
  extensions: [".gp3", ".gp4", ".gp5", ".gpx", ".gp"],
  maxFiles: 50,
  maxFileBytes: 1.5 * 1024 * 1024,
} as const;
const MAX_USER_GP_FILES = OWN_MATERIAL_GP_LIMITS.maxFiles;
const formats = OWN_MATERIAL_GP_LIMITS.extensions
  .map((ext) => ext.slice(1).toUpperCase())
  .join(", ");
const maxMb = OWN_MATERIAL_GP_LIMITS.maxFileBytes / (1024 * 1024);

export const OWN_MATERIAL_SOURCES = {
  gp: {
    title: "A Guitar Pro file you already have",
    text: `Upload it to your library and it opens as a practice session: pick the track you play, set a time limit or none, and go. Up to ${MAX_USER_GP_FILES} files of ${maxMb} MB each, sorted into folders. ${formats} all work.`,
  },
  editor: {
    title: "Or a blank tab",
    text: "Write it in the tab editor, beat by beat, with the keyboard: frets, note values, rests, hammer-ons, pull-offs, bends, vibrato, palm mutes, taps and picking direction. It plays back as you write, at any tempo from 40 to 208 BPM, and it can pull one track out of a Guitar Pro file to start from.",
  },
} as const;

export const OWN_MATERIAL_EXERCISE_PARTS = [
  {
    label: "Everything a library exercise has",
    desc: "A title, a description, steps, tips, a tempo range with a recommended speed, a length, a category, a difficulty and the skills it trains.",
  },
  {
    label: "Practised like one",
    desc: "The tab scrolls, Pitch Detect marks every note, and the session counts towards your points and streak.",
  },
  {
    label: "Part of your routine",
    desc: "Put it in a practice plan next to library exercises, or set a goal on it and climb to a target tempo.",
  },
  {
    label: "Public or private",
    desc: "Share it with every player or keep it to yourself, and change your mind later. Either way you can keep editing it.",
  },
] as const;

export interface BackingSourceCopy {
  id: "generated" | "gp" | "recording";
  tab: string;
  title: string;
  text: string;
}

export const OWN_MATERIAL_BACKINGS: BackingSourceCopy[] = [
  {
    id: "generated",
    tab: "A tab you wrote",
    title: "A band that reads your notes",
    text: "An exercise with a tab gets its own backing, written for it: the app reads the key and the chords from the notes you wrote, picks a groove, and a soft electronic band of drums, bass and keys plays under you. Nothing to set up.",
  },
  {
    id: "gp",
    tab: "A Guitar Pro file",
    title: "The band that came in the file",
    text: "A Guitar Pro file already holds the drums, the bass and the other guitars. They all play along, each with its own volume, so you can turn down the part you are playing and take its place.",
  },
  {
    id: "recording",
    tab: "A song from the library",
    title: "The record itself",
    text: "For a song, line the tab up with the real thing: a YouTube video plays alongside as picture, and in the desktop app your own audio file plays as the backing. Drag a bar line onto the beat, or let auto-sync find it for you.",
  },
];

export const OWN_MATERIAL_FAQS: faqQuestionInterface[] = [
  {
    title: "Do I need Guitar Pro?",
    message:
      "No. The tab editor runs in the browser, and the Guitar Pro library takes files from Guitar Pro or any program that saves to its formats. You only need an account to save and practise what you made.",
  },
  {
    title: "Which files can I upload?",
    message: `${formats}, up to ${maxMb} MB each and ${MAX_USER_GP_FILES} files in total.`,
  },
  {
    title: "Does the tab editor work on a phone?",
    message:
      "No. It is built around the keyboard and a wide grid, so it opens on a computer. Exercises you make can be practised on any device.",
  },
  {
    title: "Can I keep my exercises private?",
    message:
      "Yes. Switch it to private when you save it, or later. Public exercises show up in the community tab; private ones only for you. You can edit it either way.",
  },
  {
    title: "Can I play along to the original recording?",
    message:
      "For songs from the library, yes. A YouTube video plays as picture in the browser and the desktop app, and the recording itself plays from your own audio file in the desktop app, synced to the tab.",
  },
  {
    title: "What do I get when someone plays my exercise?",
    message: `Players can rate it and send thanks, which gives you ${THANKS_FAME_REWARD} Fame each time. The first time a new player completes it, you get ${COMPLETION_FAME_REWARD} more.`,
  },
];
