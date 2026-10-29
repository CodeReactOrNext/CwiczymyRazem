import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { cumulativeDailyFame } from "utils/gameLogic/calculateSessionFame";

/**
 * Fame for finishing the three daily quests. Copied from userSlice.questActions,
 * whose module pulls in Redux and Firebase; the test keeps the two equal.
 */
export const ARSENAL_DAILY_QUEST_FAME = 40;

/** A Standard Case, the cheapest gear case on the shelf. */
export const ARSENAL_STANDARD_CASE_FAME = 180;

const halfHourFame = Math.round(cumulativeDailyFame(30));

/**
 * Feature landing for the Arsenal: the collecting game paid for with Fame,
 * which practice earns. The page is honest that none of it makes anyone a
 * better guitarist — it is the reward layer — and that Fame cannot be bought.
 *
 * Catalogue sizes, case prices, rig and signal-path payouts are read from the
 * arsenal data at build time (lib/arsenalProps); the wiki article
 * `arsenal-and-gear` stays the how-to.
 */
export const ARSENAL_META = {
  slug: "features/guitar-practice-rewards",
  eyebrow: "Arsenal",
  title: "Practise for real. Spend it on a rig.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Practice Guitar, Collect Gear, Build a Rig | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Every minute of guitar practice earns Fame. Spend it on cases of virtual guitars and pedals, upgrade them in the Workshop, and wire up a pedalboard.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/arsenal-landing/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const ARSENAL_APP_PATH = "/arsenal";
export const ARSENAL_CTA_HREF = signupThen(ARSENAL_APP_PATH);

/** The loop the page tells, in order. */
export const ARSENAL_LOOP = [
  {
    title: "Practise",
    text: "Every session pays Fame on top of points: more per minute for a short daily habit than a marathon, and more again when the microphone scores you at 85% or better.",
  },
  {
    title: "Open cases",
    text: "Spend the Fame on cases of guitars and pedals. A bad-luck counter on every case guarantees a new model or a rarer drop after a run of repeats.",
  },
  {
    title: "Build it up",
    text: "Restore the condition, add build levels, fit mods and merge duplicates in the Workshop. Every step raises the item's level.",
  },
  {
    title: "Play your rig",
    text: "Equip your best guitars and wire a pedalboard. Your rig pays Fame for every hour you practise, and a board wired in the right order pays more.",
  },
] as const;

export const ARSENAL_WORKSHOP = [
  {
    label: "Restore",
    desc: "Take an item up a condition grade at a time, all the way to Museum. It adds Item Level, never resale value: restoring is for keeps.",
  },
  {
    label: "Build",
    desc: "Fit one more upgrade, with no ceiling. Every level asks for more parts and rarer ones, and pays more on a rarer instrument.",
  },
  {
    label: "Mods",
    desc: "Hand-wound pickups, a bone nut, stainless frets. Mods are things you own: they come off scrapped gear, from the Trader or from other players, and each has to physically fit the instrument.",
  },
  {
    label: "Merge and rework",
    desc: "A duplicate merges into your best copy for extra levels. A pile of common parts reworks into rarer ones, the only road to a Unique part short of scrapping a Mythic.",
  },
] as const;

export const ARSENAL_SHOPS = [
  {
    title: "Trader",
    text: "The game's own shop. Parts by the piece, one loose mod, two guitars and two pedals a day, the same stock for everyone.",
  },
  {
    title: "Market",
    text: "Other players' listings: guitars, pedals and loose mods, priced by whoever put them up.",
  },
  {
    title: "Commissions",
    text: "From level 30, order any model still missing from your Dex by name, for Fame and the parts it is made of.",
  },
  {
    title: "Guitar Builder",
    text: "Collect bodies, necks, headstocks, pickups and finishes from the Parts Crate and assemble a guitar of your own, named by you.",
  },
] as const;

export const ARSENAL_FAQS: faqQuestionInterface[] = [
  {
    title: "Can I buy Fame with real money?",
    message:
      "No. Every route to Fame is in the app: practice itself, daily quests, weekly milestones, monthly challenges, seasons and what the community pays you for things you share. Riff Quest is free, and nothing in it is sold.",
  },
  {
    title: "Does gear make me better or raise my score?",
    message:
      "No. The Arsenal is a separate game with its own ranking. Your points, level and streak come from practice alone; the gear is what you spend the reward on.",
  },
  {
    title: "Are these real guitars?",
    message:
      "They are virtual instruments drawn for the game, with their own names, rarities and conditions. You collect them, you do not receive anything physical.",
  },
  {
    title: "I keep opening duplicates. What now?",
    message:
      "Merge the duplicate into your best copy of the same model for extra levels, or scrap it for parts. Every case also counts your bad luck and guarantees a new model or a rarer drop when the bar fills.",
  },
  {
    title: "Why does the order of my pedals matter?",
    message:
      "Because guitarists settled on a running order decades ago: tuner first, dirt in the middle, delay and reverb last. A board wired that way pays Fame every hour you practise, on top of what the gear is worth.",
  },
  {
    title: "How long until I can afford something good?",
    message: `A Standard Case costs ${ARSENAL_STANDARD_CASE_FAME} Fame. Half an hour of practice a day pays about ${halfHourFame} from the practice curve alone, finishing the daily quests adds ${ARSENAL_DAILY_QUEST_FAME}, and your rig adds more the bigger it gets. The calculator on this page does the maths for your own numbers.`,
  },
];
