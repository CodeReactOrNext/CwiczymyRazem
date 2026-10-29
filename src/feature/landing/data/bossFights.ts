import { DIFFICULTIES, DIFFICULTY } from "feature/bosses/utils/difficulty";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import type { BossFightNumbers } from "feature/landing/lib/bossFightsProps";

/**
 * Feature landing for Boss Fights (`/bosses` in the app): three bosses, one
 * endless fight each, judged note by note through the microphone.
 *
 * The phases, boons and rules come from the fight engine at build time
 * (`lib/bossFightsProps`); only the difficulty table is imported here, it is a
 * plain lookup. The wiki has no boss article yet — this page is the overview.
 */
export const BOSS_FIGHTS_META = {
  slug: "features/guitar-boss-fights",
  eyebrow: "Boss Fights",
  title: "Practice that fights back.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Boss Fights: Endless Practice Battles | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Fight a boss with your guitar: finger drills, chord changes or soloing over chords. Every phase gets faster, and the mic judges every note. Free.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/boss-fights/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const BOSS_FIGHTS_APP_PATH = "/bosses";
export const BOSS_FIGHTS_CTA_HREF = signupThen(BOSS_FIGHTS_APP_PATH);
export const BOSS_FIGHTS_RULES_ANCHOR = "how-a-fight-works";

const percent = (share: number) =>
  `${share < 1 ? "−" : share > 1 ? "+" : ""}${Math.round(Math.abs(share - 1) * 100)}%`;

/** The four difficulties as the lair offers them, easiest first. */
export const BOSS_FIGHTS_DIFFICULTIES = DIFFICULTIES.map((id) => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  damage:
    DIFFICULTY[id].damage === 1 ? "as dealt" : percent(DIFFICULTY[id].damage),
  tempo:
    DIFFICULTY[id].tempo === 1 ? "as dealt" : percent(DIFFICULTY[id].tempo),
  reward: `×${DIFFICULTY[id].reward}`,
}));

export const bossFightsFaqs = (
  numbers: BossFightNumbers,
): faqQuestionInterface[] => [
  {
    title: "Do I need a microphone?",
    message:
      "Yes. Every note is judged by what the game hears, so it needs your guitar through a microphone, or an audio interface in the desktop app. An acoustic in front of a laptop is enough.",
  },
  {
    title: "Does a fight count as practice?",
    message:
      "Yes. Finish the run and it is saved like any other session: the time, the points it earns and your daily streak. The fight itself pays no Fame; what you keep from it is your record, the furthest phase, the best score and how many runs.",
  },
  {
    title: "Is it the same fight every time?",
    message:
      "No. Every run is dealt from a new random seed, so the finger orders, the progressions, the keys and the boons on offer change from run to run. Only the curve stays: each phase a little faster than the last.",
  },
  {
    title: "What if it is too hard?",
    message: `Pick Easy: bites cost ${percent(DIFFICULTY.easy.damage).slice(1)} less and the tempo drops ${percent(DIFFICULTY.easy.tempo).slice(1)}. Between phases you can also take Slow down, a boon that takes ${numbers.slowDownBpm} BPM off every phase after it. Easy scores half as much as Normal; Brutal scores double.`,
  },
  {
    title: "What happens when I lose?",
    message: `The run ends, and that is all. Every ${numbers.gateEvery}th phase is a gate, and a gate you have reached becomes a savepoint: your next run can start there.`,
  },
  {
    title: "Which boss should I start with?",
    message:
      "The Fretweaver if you are working on speed and finger independence, the Stone Colossus if chord changes still trip you up, the Changeling once you know your chord shapes and want to improvise over them. The Changeling explains itself in a short guide before your first fight.",
  },
];
