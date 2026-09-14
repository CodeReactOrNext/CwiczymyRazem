import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Compass,
  Dumbbell,
  FileMusic,
  FilePlus,
  Flame,
  Guitar,
  Heart,
  Kanban,
  Layers,
  ListChecks,
  ListMusic,
  Map as MapIcon,
  Milestone,
  Network,
  NotebookPen,
  PenLine,
  Route,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  Video,
} from "lucide-react";

export type ShortcutGroup =
  | "practice"
  | "songs"
  | "library"
  | "progress"
  | "community"
  | "gear"
  | "other";

export interface ShortcutDefinition {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: ShortcutGroup;
}

/** Section headings in the picker, in the order the sidebar lists them. */
export const SHORTCUT_GROUP_LABELS: Record<ShortcutGroup, string> = {
  practice: "Practice",
  songs: "Songs",
  library: "My Stuff",
  progress: "Progress",
  community: "Community",
  gear: "Arsenal",
  other: "Other",
};

export const SHORTCUT_GROUP_ORDER: ShortcutGroup[] = [
  "practice",
  "songs",
  "library",
  "progress",
  "community",
  "gear",
  "other",
];

/**
 * Every destination a player can pin to the Shortcuts card. Labels and hrefs
 * mirror the sidebar so a shortcut reads the same as the menu entry it stands
 * in for.
 */
export const SHORTCUTS = [
  {
    id: "practice-plans",
    label: "Practice Routines",
    href: "/timer/plans",
    icon: ListChecks,
    group: "practice",
  },
  {
    id: "practice-auto",
    label: "Auto Plan",
    href: "/timer/auto",
    icon: Sparkles,
    group: "practice",
  },
  {
    id: "practice-free-timer",
    label: "Free Timer",
    href: "/timer/practice",
    icon: Timer,
    group: "practice",
  },
  {
    id: "practice-report",
    label: "Manual Log",
    href: "/report",
    icon: NotebookPen,
    group: "practice",
  },
  {
    id: "practice-gp-tabs",
    label: "Guitar Pro Files",
    href: "/gp-tabs",
    icon: FileMusic,
    group: "practice",
  },
  {
    id: "practice-skills",
    label: "Skills",
    href: "/profile/skills?tab=skill-tree",
    icon: Layers,
    group: "practice",
  },
  {
    id: "practice-exercises",
    label: "Exercises",
    href: "/profile/skills?tab=browse",
    icon: Dumbbell,
    group: "practice",
  },
  {
    id: "practice-roadmaps",
    label: "Mastery Roadmaps",
    href: "/ai-coach",
    icon: MapIcon,
    group: "practice",
  },
  {
    id: "practice-journey",
    label: "Learning Path",
    href: "/journey",
    icon: Route,
    group: "practice",
  },
  {
    id: "practice-scale-map",
    label: "Scale Map",
    href: "/scale-tree",
    icon: Network,
    group: "practice",
  },
  {
    id: "songs-board",
    label: "Song Board",
    href: "/songs?view=board",
    icon: Kanban,
    group: "songs",
  },
  {
    id: "songs-explore",
    label: "Explore Songs",
    href: "/songs?view=explore",
    icon: Compass,
    group: "songs",
  },
  {
    id: "songs-playlists",
    label: "Playlists",
    href: "/songs?view=playlists",
    icon: ListMusic,
    group: "songs",
  },
  {
    id: "library-favorites",
    label: "Favorites",
    href: "/favorites",
    icon: Heart,
    group: "library",
  },
  {
    id: "library-plans",
    label: "My Plans",
    href: "/plans",
    icon: BookOpen,
    group: "library",
  },
  {
    id: "library-exercises",
    label: "My Exercises",
    href: "/my-exercises",
    icon: Guitar,
    group: "library",
  },
  {
    id: "library-create-plan",
    label: "Create Plan",
    href: "/plans/create",
    icon: FilePlus,
    group: "library",
  },
  {
    id: "library-create-exercise",
    label: "Create Exercise",
    href: "/tab-editor",
    icon: PenLine,
    group: "library",
  },
  {
    id: "progress-activity",
    label: "Activity",
    href: "/profile/activity",
    icon: TrendingUp,
    group: "progress",
  },
  {
    id: "progress-milestones",
    label: "Milestones",
    href: "/summary",
    icon: Milestone,
    group: "progress",
  },
  {
    id: "community-rankings",
    label: "Rankings",
    href: "/seasons",
    icon: Trophy,
    group: "community",
  },
  {
    id: "progress-challenges",
    label: "Challenges",
    href: "/challenges",
    icon: Flame,
    group: "community",
  },
  {
    id: "recordings",
    label: "Recordings",
    href: "/recordings",
    icon: Video,
    group: "community",
  },
  {
    id: "community-guilds",
    label: "Guilds",
    href: "/guilds",
    icon: Shield,
    group: "community",
  },
  {
    id: "arsenal",
    label: "Arsenal",
    href: "/arsenal",
    icon: Swords,
    group: "gear",
  },
  {
    id: "tone-studio",
    label: "Tone Studio",
    href: "/tone-studio",
    icon: SlidersHorizontal,
    group: "gear",
  },
  {
    id: "wiki",
    label: "Knowledge Base",
    href: "/wiki",
    icon: BookMarked,
    group: "other",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    group: "other",
  },
] as const satisfies readonly ShortcutDefinition[];

export type ShortcutId = (typeof SHORTCUTS)[number]["id"];

const SHORTCUT_BY_ID: ReadonlyMap<string, ShortcutDefinition> = new Map(
  SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]),
);

export const isShortcutId = (value: unknown): value is ShortcutId =>
  typeof value === "string" && SHORTCUT_BY_ID.has(value);

export const getShortcut = (id: ShortcutId): ShortcutDefinition =>
  SHORTCUT_BY_ID.get(id) as ShortcutDefinition;
