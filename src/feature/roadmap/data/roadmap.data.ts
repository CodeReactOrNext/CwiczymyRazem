import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  AudioLines,
  AudioWaveform,
  Bell,
  Cable,
  CircleHelp,
  Compass,
  Ear,
  Flame,
  Hand,
  Quote,
  Radio,
  Route,
  Signal,
  SkipForward,
  Skull,
  Smartphone,
  Spline,
  Trophy,
  Waves,
  Waypoints,
} from "lucide-react";

export type RoadmapStatus = "shipped" | "in_progress" | "locked";

/** A unlock either ships a big feature or adds more content. */
export type TierKind = "feature" | "content";

export interface RoadmapTier {
  id: string;
  /** What this step costs on top of the one before it (USD). */
  cost: number;
  /**
   * Lifetime total raised (USD) needed to unlock this: the running sum of every
   * `cost` up to and including this tier. Drives the ladder, never shown — the
   * page only ever says how much is still missing for the next step.
   */
  goal: number;
  icon: LucideIcon;
  label: string;
  kind: TierKind;
  /**
   * What a content pack is about, e.g. "Chord Changes" for "+3 New Exercises"
   * or "Vintage Classics" for "+15 New Guitars & Pedals". Packs share a label,
   * so the topic (plus its own icon and description) is what makes each one
   * its own step instead of the same drop again.
   */
  topic?: string;
  /** Optional longer explanation shown under the label in the tooltip. */
  description?: string;
  /** Marks a tier whose work is actually delivered — shown green as "Done". */
  done?: boolean;
  /** Marks a tier that's being built right now — shown as "In progress". */
  inProgress?: boolean;
}

type RoadmapStep = Omit<RoadmapTier, "goal">;

/**
 * Monthly running cost. Buy Me a Coffee support covers this first; everything
 * above funds the roadmap.
 */
export const MONTHLY_RUNNING_COST = 40;

/** Buy Me a Coffee page — the single donate destination used everywhere. */
export const BMC_URL = "https://buymeacoffee.com/riffquest";

/**
 * Snapshot of the real lifetime total (USD) at the moment the roadmap tiers
 * were reset (last reset: 2026-10-29). Subtracted from the live Buy Me a Coffee
 * total so the tier ladder above starts counting from $0 again, without
 * touching the real historical funding record in Firestore.
 */
export const ROADMAP_RAISED_OFFSET = 648;

/**
 * The roadmap, step by step. Each step lists only its own cost; the cumulative
 * goal is derived below, so reordering or repricing a step never means
 * recomputing every goal after it by hand.
 */
const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: "ex-chord-changes",
    cost: 30,
    icon: ArrowLeftRight,
    label: "+3 New Exercises",
    topic: "Chord Changes",
    kind: "content",
    description:
      "Switch chords in time, without the pause before every new shape.",
  },
  {
    id: "bass",
    cost: 40,
    icon: AudioWaveform,
    label: "Bass Support",
    kind: "feature",
    description:
      "Practice on bass, not only guitar: four-string tabs, bass tuning and note detection that hears the low end.",
  },
  {
    id: "mcp",
    cost: 35,
    icon: Cable,
    label: "Connect Your AI Assistant (MCP)",
    kind: "feature",
    description:
      "Connect ChatGPT or Claude to your account. Log a session by telling it what you practiced, ask about your progress, or have it build a practice plan straight into the app.",
  },
  {
    id: "gear-1",
    cost: 40,
    icon: Radio,
    label: "+15 New Guitars & Pedals",
    topic: "Vintage Classics",
    kind: "content",
    description:
      "Guitars from the '50s to the '70s and the pedals they were played through: fuzz, tape echo, tremolo.",
  },
  {
    id: "ex-ear-training",
    cost: 30,
    icon: Ear,
    label: "+3 New Exercises",
    topic: "Ear Training",
    kind: "content",
    description:
      "Name what you hear: intervals, chord qualities and simple progressions.",
  },
  {
    id: "what-next",
    cost: 35,
    icon: Compass,
    label: "What Next",
    kind: "feature",
    description:
      "A command center that tells you what to do next: which exercise, which plan, and which goal is closest.",
  },
  {
    id: "journey-intervals",
    cost: 40,
    icon: Route,
    label: "Journey: Intervals",
    kind: "feature",
    description:
      "A new Journey module: hear, find and play intervals all over the fretboard.",
  },
  {
    id: "ex-scales",
    cost: 35,
    icon: Signal,
    label: "+3 New Exercises",
    topic: "Scales",
    kind: "content",
    description:
      "Major, minor and pentatonic shapes, played in time across the whole neck.",
  },
  {
    id: "jam-room",
    cost: 45,
    icon: AudioLines,
    label: "Jam Room",
    kind: "feature",
    description:
      "Generate your own backing tracks to improvise over: pick a key, a scale and a feel, then play.",
  },
  {
    id: "gear-2",
    cost: 35,
    icon: Waves,
    label: "+15 New Guitars & Pedals",
    topic: "Ambient & Space",
    kind: "content",
    description:
      "Shimmer reverbs, long delays and loopers, plus guitars made for clean, wide sounds.",
  },
  {
    id: "ach-1",
    cost: 20,
    icon: Trophy,
    label: "+5 New Achievements",
    kind: "content",
  },
  {
    id: "ex-legato",
    cost: 30,
    icon: Spline,
    label: "+3 New Exercises",
    topic: "Legato",
    kind: "content",
    description:
      "Hammer-ons and pull-offs that sound even and loud enough without the pick.",
  },
  {
    id: "ex-arpeggios",
    cost: 40,
    icon: Waypoints,
    label: "+3 New Exercises",
    topic: "Arpeggios",
    kind: "content",
    description:
      "Chord tones one note at a time: the backbone of melodic solos.",
  },
  {
    id: "journey-improvisation",
    cost: 45,
    icon: Route,
    label: "Journey: Improvisation Fundamentals",
    kind: "feature",
    description:
      "A new Journey module: your first steps in improvising, from a few notes over a backing track to short phrases of your own.",
  },
  {
    id: "ex-phrasing",
    cost: 35,
    icon: Quote,
    label: "+3 New Exercises",
    topic: "Phrasing",
    kind: "content",
    description:
      "Make a few notes say something: timing, space, bends and repetition.",
  },
  {
    id: "ex-without-guitar",
    cost: 40,
    icon: Smartphone,
    label: "+3 New Exercises",
    topic: "Without Guitar",
    kind: "content",
    description:
      "Perfect for a phone break: exercises you can do without picking up the guitar.",
  },
  {
    id: "gear-3",
    cost: 45,
    icon: Bell,
    label: "+15 New Guitars & Pedals",
    topic: "Clean & Jangle",
    kind: "content",
    description:
      "Semi-hollows and bright single-coils, with compressors and chorus for chords that ring.",
  },
  {
    id: "ex-string-skipping",
    cost: 40,
    icon: SkipForward,
    label: "+3 New Exercises",
    topic: "String Skipping",
    kind: "content",
    description:
      "Jump across strings cleanly, without the wrong one ringing out.",
  },
  {
    id: "boss-1",
    cost: 35,
    icon: Skull,
    label: "+1 New Boss",
    kind: "content",
    description: "A new boss with a challenge none of the others use.",
  },
  {
    id: "ach-2",
    cost: 20,
    icon: Trophy,
    label: "+5 New Achievements",
    kind: "content",
  },
  {
    id: "journey-chords",
    cost: 35,
    icon: Route,
    label: "Journey: Chords & Triads",
    kind: "feature",
    description:
      "A new Journey module: open chords, clean changes, and triads up the neck.",
  },
  {
    id: "ex-alternate-picking",
    cost: 45,
    icon: ArrowDownUp,
    label: "+3 New Exercises",
    topic: "Alternate Picking",
    kind: "content",
    description:
      "Strict down-up picking across strings, from slow and even to fast.",
  },
  {
    id: "gear-4",
    cost: 45,
    icon: Flame,
    label: "+15 New Guitars & Pedals",
    topic: "High Gain",
    kind: "content",
    description:
      "Extended-range shred guitars, high-gain distortion and noise gates for fast, tight riffs.",
  },
  {
    id: "ach-3",
    cost: 20,
    icon: Trophy,
    label: "+5 New Achievements",
    kind: "content",
  },
  {
    id: "ex-finger-independence",
    cost: 45,
    icon: Hand,
    label: "+3 New Exercises",
    topic: "Finger Independence",
    kind: "content",
    description:
      "Drills for the fretting hand that teach each finger to move on its own.",
  },
  {
    id: "ex-mystery",
    cost: 45,
    icon: CircleHelp,
    label: "+3 New Exercises",
    topic: "???",
    kind: "content",
    description: "A surprise. You'll see what's inside when it unlocks.",
  },
  {
    id: "journey-speed",
    cost: 50,
    icon: Route,
    label: "Journey: Speed & Precision",
    kind: "feature",
    description:
      "A new Journey module: build speed without losing accuracy, through picking, synchronization and muting.",
  },
];

/**
 * The roadmap as lifetime funding tiers. As the total raised climbs, each tier
 * unlocks — big features plus a steady stream of new content.
 */
export const ROADMAP_TIERS: RoadmapTier[] = ROADMAP_STEPS.map(
  (step, index) => ({
    ...step,
    goal: ROADMAP_STEPS.slice(0, index + 1).reduce((sum, s) => sum + s.cost, 0),
  }),
);
