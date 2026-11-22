import { CATEGORY_CHIP_COLOR } from "feature/exercisePlan/constants/categoryChip";

import type { CategoryKey } from "./timeSteps";

/** The hues a lit time block can take — the category chip colours. */
export type BlockTone = "emerald" | "blue" | "amber" | "purple";

interface ToneClasses {
  /** The wash and edge of a block that holds time. */
  row: string;
  /** The icon plate heading that block. */
  badge: string;
  /** Its minutes. */
  number: string;
  /** Its share bar in the session summary. */
  bar: string;
}

/**
 * Spelled out in full so Tailwind sees every class. The hues follow the app's
 * category chips (technique emerald, theory blue, hearing amber, creativity
 * purple), so a category reads in the same colour here as everywhere else.
 */
export const TONE_CLASSES: Record<BlockTone, ToneClasses> = {
  emerald: {
    row: "from-emerald-500/[0.16] via-emerald-500/[0.07] to-emerald-500/[0.03] ring-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-300",
    number: "text-emerald-300",
    bar: "bg-emerald-500",
  },
  blue: {
    row: "from-blue-500/[0.18] via-blue-500/[0.08] to-blue-500/[0.03] ring-blue-500/35",
    badge: "bg-blue-500/15 text-blue-300",
    number: "text-blue-300",
    bar: "bg-blue-500",
  },
  amber: {
    row: "from-amber-500/[0.16] via-amber-500/[0.07] to-amber-500/[0.03] ring-amber-500/30",
    badge: "bg-amber-500/15 text-amber-300",
    number: "text-amber-300",
    bar: "bg-amber-400",
  },
  purple: {
    row: "from-purple-500/[0.18] via-purple-500/[0.08] to-purple-500/[0.03] ring-purple-500/35",
    badge: "bg-purple-500/15 text-purple-300",
    number: "text-purple-300",
    bar: "bg-purple-500",
  },
};

export const categoryTone = (category: CategoryKey): BlockTone =>
  CATEGORY_CHIP_COLOR[category] as BlockTone;
