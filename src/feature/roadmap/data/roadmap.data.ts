import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Guitar,
  Laptop,
  ListMusic,
  Map,
  Music4,
  Palette,
  Target,
  Video,
  Wrench,
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

/**
 * The roadmap as lifetime funding tiers. As the total raised climbs, each tier
 * unlocks — big features plus a steady stream of new content.
 */
export const ROADMAP_TIERS: RoadmapTier[] = [
  { id: "t5", goal: 5, icon: Guitar, label: "+10 New Guitars & Pedals", kind: "content", done: true },
  { id: "t15", goal: 15, icon: Target, label: "+5 New Exercises", kind: "content", done: true },
  { id: "t25", goal: 25, icon: ClipboardList, label: "+2 New Practice Plans", kind: "content", done: true },
  { id: "t35", goal: 35, icon: Guitar, label: "+10 New Guitars & Pedals", kind: "content", done: true },
  {
    id: "t45",
    goal: 45,
    icon: ListMusic,
    label: "Community Song Playlists",
    kind: "feature",
    description:
      "Build your own song collections, like a list of top songs with easy solos, and share them with the rest of the community to practice through.",
  },
  {
    id: "t60",
    goal: 60,
    icon: Music4,
    label: "Standard Notation View for All Exercises",
    kind: "feature",
    description:
      "A Guitar Pro style view that shows the sheet music notation and the tablature together, on every single exercise, so you can read whichever you prefer.",
  },
  { id: "t70", goal: 70, icon: Target, label: "+5 New Exercises", kind: "content" },
  {
    id: "t80",
    goal: 80,
    icon: Wrench,
    label: "Improved Custom Exercises",
    kind: "feature",
    description:
      "A much better tab editor, Fame Points every time someone practices a plan you made, plus a bunch of smaller tweaks and quality of life improvements across the whole exercise builder.",
  },
  { id: "t90", goal: 90, icon: Guitar, label: "+10 New Guitars & Pedals", kind: "content" },
  { id: "t105", goal: 105, icon: Palette, label: "Fully Customizable Tablature", kind: "feature" },
  {
    id: "t115",
    goal: 115,
    icon: Laptop,
    label: "Desktop App",
    kind: "feature",
    description:
      "A desktop app you can download, where you build your own tones right inside it, load your own IRs, and play with zero latency.",
  },
  {
    id: "t130",
    goal: 130,
    icon: Map,
    label: "New Journey",
    kind: "feature",
    description:
      "A brand new structured journey to work through from start to finish, complete with backing tracks to play along to.",
  },
  { id: "t140", goal: 140, icon: Target, label: "+5 New Exercises", kind: "content" },
  { id: "t150", goal: 150, icon: Video, label: "Video Demonstrations for Challenging Exercises", kind: "feature" },
];
