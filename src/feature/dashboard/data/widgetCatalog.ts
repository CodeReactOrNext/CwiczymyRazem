import { LEVELS } from "feature/aiSummary/utils/milestoneLogic";
import {
  milestoneWidgetDescription,
  milestoneWidgetId,
  milestoneWidgetTier,
} from "feature/dashboard/data/milestoneWidgets";
import type {
  StaticWidgetId,
  WidgetGroup,
  WidgetId,
  WidgetSize,
} from "feature/dashboard/types/dashboard.types";
import { WIDGET_IDS } from "feature/dashboard/types/dashboard.types";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Flame,
  Gift,
  HandHeart,
  History,
  Medal,
  Music2,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  description: string;
  icon: LucideIcon;
  group: WidgetGroup;
  defaultSize: WidgetSize;
  /** False when the content needs the whole row — the card is always full width. */
  resizable: boolean;
  /** Renders nothing when there is nothing to show (no level owed, no support run this week…). */
  mayBeEmpty?: boolean;
  /** Keeps its own controls live while Home is being customised (the Shortcuts picker). */
  editable?: boolean;
}

export const WIDGET_GROUP_LABELS: Record<WidgetGroup, string> = {
  practice: "Practice",
  progress: "Progress",
  milestones: "Weekly goals",
  community: "Community",
};

export const WIDGET_GROUP_ORDER: WidgetGroup[] = [
  "practice",
  "progress",
  "milestones",
  "community",
];

const DEFINITIONS: Record<StaticWidgetId, Omit<WidgetDefinition, "id">> = {
  "daily-quests": {
    title: "Daily quests",
    description: "Today's three tasks and the Claim button.",
    icon: Swords,
    group: "practice",
    defaultSize: "half",
    resizable: true,
  },
  "practice-stats": {
    title: "This week",
    description: "Minutes per day against your daily target, plus the streak.",
    icon: BarChart3,
    group: "practice",
    defaultSize: "half",
    resizable: true,
  },
  streak: {
    title: "Streak",
    description:
      "Days in a row, the points bonus it earns, and whether today is done.",
    icon: Flame,
    group: "practice",
    defaultSize: "half",
    resizable: true,
  },
  shortcuts: {
    title: "Shortcuts",
    description: "Your own row of quick links to anywhere in the app.",
    icon: Zap,
    group: "practice",
    defaultSize: "full",
    resizable: true,
    editable: true,
  },
  "recent-sessions": {
    title: "Recent sessions",
    description: "Your last ten logged sessions, editable in place.",
    icon: History,
    group: "practice",
    defaultSize: "full",
    resizable: false,
  },
  "activity-log": {
    title: "Activity",
    description: "A square for every day you have practised this year.",
    icon: Activity,
    group: "progress",
    defaultSize: "full",
    resizable: false,
  },
  "level-rewards": {
    title: "Level rewards",
    description:
      "What the next levels unlock and anything a level-up has just paid out.",
    icon: Gift,
    group: "progress",
    defaultSize: "full",
    resizable: true,
    mayBeEmpty: true,
  },
  songs: {
    title: "Songs",
    description:
      "Learned, learning and want-to-learn counts with your song tier.",
    icon: Music2,
    group: "progress",
    defaultSize: "full",
    resizable: false,
  },
  rank: {
    title: "Your rank",
    description:
      "Where you sit on the all-time ladder and in the season running now.",
    icon: Trophy,
    group: "community",
    defaultSize: "half",
    resizable: true,
  },
  "monthly-challenge": {
    title: "Monthly challenge",
    description: "This month's five songs and which ones you have recorded.",
    icon: Medal,
    group: "community",
    defaultSize: "half",
    resizable: true,
  },
  "community-goal": {
    title: "Support challenge",
    description: "The supporters' weekly goal and the reward when it lands.",
    icon: HandHeart,
    group: "community",
    defaultSize: "full",
    resizable: true,
    mayBeEmpty: true,
  },
};

/** One tier's own card, built from the tier table so a new tier needs no entry here. */
const milestoneDefinition = (id: WidgetId): WidgetDefinition | null => {
  const tier = milestoneWidgetTier(id);
  if (!tier) return null;
  return {
    id: milestoneWidgetId(tier.id),
    title: tier.name,
    description: milestoneWidgetDescription(tier),
    icon: tier.Icon,
    group: "milestones",
    defaultSize: "half",
    resizable: true,
  };
};

export const WIDGET_CATALOG: WidgetDefinition[] = [
  ...WIDGET_IDS.map((id) => ({ id, ...DEFINITIONS[id] })),
  ...LEVELS.map((tier) => milestoneDefinition(milestoneWidgetId(tier.id))!),
];

export const isWidgetId = (value: unknown): value is WidgetId =>
  typeof value === "string" &&
  (value in DEFINITIONS || milestoneWidgetTier(value) !== null);

export const getWidgetDefinition = (id: WidgetId): WidgetDefinition =>
  milestoneDefinition(id) ?? {
    id,
    ...DEFINITIONS[id as StaticWidgetId],
  };
