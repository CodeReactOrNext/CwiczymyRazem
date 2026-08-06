import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  ClipboardList,
  Clock,
  Gamepad2,
  Gauge,
  Gift,
  Guitar,
  Hammer,
  Layers,
  LayoutDashboard,
  Plug,
  Recycle,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  UserCircle,
  Wand2,
} from "lucide-react";

export type RoadmapStatus = "shipped" | "in_progress" | "locked";

/** A unlock either ships a big feature or adds more content. */
export type TierKind = "feature" | "content";

export interface RoadmapTier {
  id: string;
  /** Lifetime total raised (USD) needed to unlock this. */
  goal: number;
  icon: LucideIcon;
  label: string;
  kind: TierKind;
  /** Optional longer explanation shown under the label in the tooltip. */
  description?: string;
  /** Marks a tier whose work is actually delivered — shown green as "Done". */
  done?: boolean;
}

/**
 * Monthly running cost. Buy Me a Coffee support covers this first; everything
 * above funds the roadmap.
 */
export const MONTHLY_RUNNING_COST = 20;

/** Buy Me a Coffee page — the single donate destination used everywhere. */
export const BMC_URL = "https://buymeacoffee.com/riffquest";

/**
 * Snapshot of the real lifetime total (USD) at the moment the roadmap tiers
 * were reset. Subtracted from the live Buy Me a Coffee total so the tier
 * ladder above starts counting from $0 again, without touching the real
 * historical funding record in Firestore.
 */
export const ROADMAP_RAISED_OFFSET = 155;

/**
 * The roadmap as lifetime funding tiers. As the total raised climbs, each tier
 * unlocks — big features plus a steady stream of new content.
 */
export const ROADMAP_TIERS: RoadmapTier[] = [
  {
    id: "t13",
    goal: 13,
    icon: Recycle,
    label: "Scrap Guitars for Parts",
    kind: "feature",
    done: true,
    description:
      "Scrap guitars you don't want. Different guitars break down into different parts, so what you keep (and what you scrap) actually matters.",
  },
  {
    id: "t25",
    goal: 25,
    icon: Hammer,
    label: "Luthier: Guitar Parts & Upgrading",
    kind: "feature",
    description:
      "Gear drops parts by rarity as you play, and the parts you scrap from guitars you don't want feed right back in. Spend matching parts at the Luthier to level up a guitar or effect and push its rarity higher.",
  },
  { id: "t33", goal: 33, icon: Target, label: "+4 New Exercises", kind: "content" },
  { id: "t41", goal: 41, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  {
    id: "t51",
    goal: 51,
    icon: Star,
    label: "Gear Affects Fame Points",
    kind: "feature",
    description:
      "The gear you're using changes how many Fame Points you earn per exercise type, so pick the right rig for the right drill.",
  },
  {
    id: "t61",
    goal: 61,
    icon: AudioLines,
    label: "Sync Backing Track to Tablature",
    kind: "feature",
    description:
      "Backing tracks for songs synced to the tab, so you can play along in time without hunting for the beat.",
  },
  { id: "t69", goal: 69, icon: Target, label: "+4 New Exercises", kind: "content" },
  {
    id: "t79",
    goal: 79,
    icon: Plug,
    label: "Pedalboard Synergy",
    kind: "feature",
    description: "Effects interact with each other, so pick and order your pedals carefully.",
  },
  {
    id: "t89",
    goal: 89,
    icon: Trophy,
    label: "Achievements Rework",
    kind: "feature",
    description:
      "A full redo of achievements, plus new ones. Each one actually gives you something, not just a badge.",
  },
  { id: "t97", goal: 97, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  {
    id: "t107",
    goal: 107,
    icon: Gauge,
    label: "Pedalboard Power Cap",
    kind: "feature",
    description: "Your pedalboard has a power limit, so upgrade it if you want to run stronger effects.",
  },
  {
    id: "t117",
    goal: 117,
    icon: Gift,
    label: "Gamification: Path/Skill Completion Rewards",
    kind: "feature",
    description:
      "Finish a Journey, Roadmap, or Skill track and get a guitar or effect dropped as a reward.",
  },
  { id: "t125", goal: 125, icon: Target, label: "+4 New Exercises", kind: "content" },
  { id: "t133", goal: 133, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  {
    id: "t143",
    goal: 143,
    icon: Sparkles,
    label: "Gear Flavor Text",
    kind: "feature",
    description:
      "Every piece of gear you pull gets its own little story, mixed and matched from a pool of phrases, so no two drops feel the same and each one earns its place in your collection.",
  },
  {
    id: "t153",
    goal: 153,
    icon: TrendingUp,
    label: "Player Progression System",
    kind: "feature",
    description:
      "Level up from playing. Unlocks milestones, profile layouts, and which gear rarity you can equip.",
  },
  { id: "t161", goal: 161, icon: Target, label: "+4 New Exercises", kind: "content" },
  { id: "t171", goal: 171, icon: Target, label: "+1 New Exercise", kind: "content" },
  {
    id: "t181",
    goal: 181,
    icon: LayoutDashboard,
    label: "Configurable Dashboard",
    kind: "feature",
    description: "Pick your own layout, widgets, and shortcuts for the main panel.",
  },
  {
    id: "t191",
    goal: 191,
    icon: Clock,
    label: "Daily Unlock",
    kind: "feature",
    description: "A time-based unlock that resets once a day, giving you a reason to come back.",
  },
  {
    id: "t201",
    goal: 201,
    icon: UserCircle,
    label: "Configurable Guitarist Profile",
    kind: "feature",
    description: "Show off what you want, how you want, using layouts unlocked through progression.",
  },
  { id: "t209", goal: 209, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  { id: "t219", goal: 219, icon: Target, label: "+1 New Exercise", kind: "content" },
  {
    id: "t229",
    goal: 229,
    icon: ClipboardList,
    label: "Practice Mode",
    kind: "feature",
    description: "Set goals per exercise and track your progress toward hitting them.",
  },
  {
    id: "t244",
    goal: 244,
    icon: Layers,
    label: "Riff Cards",
    kind: "feature",
    description:
      "Build a personal deck of riffs, songs and exercises that you can review with spaced repetition or play through freely anytime.",
  },
  { id: "t252", goal: 252, icon: Target, label: "+4 New Exercises", kind: "content" },
  {
    id: "t262",
    goal: 262,
    icon: Wand2,
    label: "Signature Guitars at the Luthier",
    kind: "feature",
    description: "The Luthier stocks one-of-a-kind guitars you won't find anywhere else.",
  },
  {
    id: "t272",
    goal: 272,
    icon: Swords,
    label: "Challenges",
    kind: "feature",
    description: "A rotating exercise that changes every few days, with its own leaderboard.",
  },
  { id: "t280", goal: 280, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  { id: "t290", goal: 290, icon: Target, label: "+1 New Exercise", kind: "content" },
  { id: "t308", goal: 308, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  { id: "t318", goal: 318, icon: Target, label: "+1 New Exercise", kind: "content" },
  { id: "t336", goal: 336, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  {
    id: "t346",
    goal: 346,
    icon: Swords,
    label: "Duels",
    kind: "feature",
    description:
      "Challenge another player for Fame Points, like who can rack up more practice time before the clock runs out.",
  },
  { id: "t364", goal: 364, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  { id: "t374", goal: 374, icon: Target, label: "+1 New Exercise", kind: "content" },
  { id: "t392", goal: 392, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  { id: "t400", goal: 400, icon: Guitar, label: "+5 New Guitars & Pedals", kind: "content" },
  {
    id: "t415",
    goal: 415,
    icon: Gamepad2,
    label: "New Practice Mode: Boss",
    kind: "feature",
    description:
      "A new practice mode: Boss. Each boss sets a real requirement to clear. Hit the score and you level up, fall short and you're knocked out, no partial credit.",
  },
];
