import type { RoadmapIdeaIcon } from "feature/supporterPanel/types/supporterPanel.types";
import { DEFAULT_ROADMAP_IDEA_ICON } from "feature/supporterPanel/types/supporterPanel.types";
import type { LucideIcon } from "lucide-react";
import {
  Bug,
  Guitar,
  Lightbulb,
  Mic2,
  Music2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";

/**
 * A short, opinionated set — one per corner of the app someone might want
 * changed. Long enough that an idea rarely has to settle for the generic bulb,
 * short enough to pick from at a glance. Client-only: the API validates against
 * the plain id list in the types instead of importing any of this.
 */
export const IDEA_ICON_COMPONENTS: Record<RoadmapIdeaIcon, LucideIcon> = {
  idea: Lightbulb,
  guitar: Guitar,
  song: Music2,
  practice: Timer,
  tone: SlidersHorizontal,
  recording: Mic2,
  gear: Swords,
  ranking: Trophy,
  stats: TrendingUp,
  mobile: Smartphone,
  bug: Bug,
  polish: Sparkles,
};

/** Spoken labels for the picker buttons, which are icon-only. */
export const IDEA_ICON_LABELS: Record<RoadmapIdeaIcon, string> = {
  idea: "General idea",
  guitar: "Guitar & fretboard",
  song: "Songs & tabs",
  practice: "Practice & timer",
  tone: "Tone & audio",
  recording: "Recording",
  gear: "Arsenal & gear",
  ranking: "Rankings & seasons",
  stats: "Stats & progress",
  mobile: "Mobile & desktop app",
  bug: "Something broken",
  polish: "Polish & small fixes",
};

export const renderIdeaIcon = (
  icon: RoadmapIdeaIcon | null | undefined,
  size = 17,
  className?: string,
): React.ReactNode => {
  const Icon =
    IDEA_ICON_COMPONENTS[icon ?? DEFAULT_ROADMAP_IDEA_ICON] ??
    IDEA_ICON_COMPONENTS[DEFAULT_ROADMAP_IDEA_ICON];

  return <Icon size={size} className={className} />;
};
