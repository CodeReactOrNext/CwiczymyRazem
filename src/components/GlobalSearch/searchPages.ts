import type { ShortcutGroup, ShortcutId } from "feature/dashboard/data/shortcutCatalog";
import { SHORTCUTS } from "feature/dashboard/data/shortcutCatalog";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  CalendarRange,
  Guitar,
  HandHeart,
  Home,
  Medal,
  Repeat,
  ScrollText,
  Signpost,
  Skull,
  Swords,
  Target,
  Timer,
  Trophy,
  User,
  Zap,
} from "lucide-react";

export interface SearchPage {
  id: string;
  /** English name — the fallback, and always matched so English queries work in any language. */
  label: string;
  /** Namespaced key of the translated name, e.g. `nav:home`. */
  titleKey?: string;
  href: string;
  icon: LucideIcon;
  group: ShortcutGroup;
  /** Extra words a player might type for this page that aren't in its name. */
  keywords?: string;
}

const SHORTCUT_KEYWORDS: Partial<Record<ShortcutId, string>> = {
  "practice-plans": "routine plans featured community",
  "practice-auto": "generate generator",
  "practice-free-timer": "stopwatch",
  "practice-report": "log add time",
  "practice-gp-tabs": "gp tabs tablature",
  "practice-exercises": "exercise catalog library browse",
  "practice-roadmaps": "ai coach",
  "practice-journey": "lessons modules fundamentals",
  "practice-scale-map": "scales scale tree",
  "songs-board": "songs repertoire",
  "songs-explore": "songs library",
  "library-create-exercise": "tab editor",
  "community-rankings": "seasons leaderboard",
  "wiki": "wiki help guide",
};

// Pages the Shortcuts card doesn't offer, but a player may still look for.
const EXTRA_PAGES: SearchPage[] = [
  { id: "home", label: "Home", titleKey: "nav:home", href: "/dashboard", icon: Home, group: "other", keywords: "dashboard" },
  { id: "practice", label: "Practice", titleKey: "nav:practice", href: "/timer", icon: Timer, group: "practice", keywords: "practice modes hub" },
  { id: "playalongs", label: "Playalongs", titleKey: "practice_hub:plans.playalongs", href: "/timer/plans?tab=playalongs", icon: Zap, group: "practice", keywords: "backing track" },
  { id: "bosses", label: "Boss Fights", titleKey: "practice_hub:modes.bosses.title", href: "/bosses", icon: Skull, group: "practice", keywords: "boss" },
  { id: "duels", label: "Duels", titleKey: "nav:duels", href: "/duels", icon: Swords, group: "community", keywords: "duel 1v1 versus" },
  { id: "rotation", label: "Rotation", titleKey: "practice_hub:modes.rotation.title", href: "/rotation", icon: Repeat, group: "library" },
  { id: "player-roadmaps", label: "Player Roadmaps", titleKey: "practice_hub:modes.player_roadmaps.title", href: "/my-roadmaps", icon: Signpost, group: "library" },
  { id: "practice-log", label: "Practice Log", href: "/practice-log", icon: ScrollText, group: "progress", keywords: "history sessions" },
  { id: "goals", label: "Goals", href: "/goals", icon: Target, group: "progress" },
  { id: "achievements", label: "Achievements", href: "/profile/achievements", icon: Medal, group: "progress", keywords: "badges" },
  { id: "profile", label: "Profile", href: "/profile", icon: User, group: "progress" },
  { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: Trophy, group: "community", keywords: "ranking" },
  { id: "seasons", label: "Seasons", href: "/seasons", icon: CalendarRange, group: "community" },
  { id: "gear-leaderboard", label: "Gear Leaderboard", href: "/leaderboard/gear", icon: Guitar, group: "community" },
  { id: "scoring", label: "How scoring works", href: "/scoring", icon: Calculator, group: "other", keywords: "points" },
  { id: "supporter", label: "Supporter", titleKey: "nav:supporter", href: "/supporter", icon: HandHeart, group: "other", keywords: "premium support ideas" },
];

export const SEARCH_PAGES: readonly SearchPage[] = [
  ...SHORTCUTS.map((shortcut) => ({
    ...shortcut,
    titleKey: `dashboard:shortcuts.items.${shortcut.id}`,
    keywords: SHORTCUT_KEYWORDS[shortcut.id],
  })),
  ...EXTRA_PAGES,
];
