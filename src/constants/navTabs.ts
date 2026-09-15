import type { PageTab } from "components/PageTabs/PageTabs";
import {
  Activity,
  CalendarRange,
  Dumbbell,
  Guitar,
  Heart,
  ListChecks,
  Medal,
  ScrollText,
  Trophy,
} from "lucide-react";

export const LIBRARY_TABS: PageTab[] = [
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "My Plans", href: "/plans", icon: ListChecks },
  { label: "My Exercises", href: "/my-exercises", icon: Dumbbell },
];

export const PROGRESS_TABS: PageTab[] = [
  { label: "Activity", href: "/profile/activity", icon: Activity },
  { label: "Practice Log", href: "/practice-log", icon: ScrollText },
  { label: "Achievements", href: "/profile/achievements", icon: Medal },
];

export const LEADERBOARD_TABS: PageTab[] = [
  { label: "Seasons", href: "/seasons", icon: CalendarRange },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  {
    label: "Gear",
    href: "/leaderboard/gear",
    icon: Guitar,
    tooltip: "Ranked by equipped guitar & rig level, not practice score",
  },
];
