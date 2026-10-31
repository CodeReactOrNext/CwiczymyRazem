import type { PageTab } from "components/PageTabs/PageTabs";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  Dumbbell,
  Guitar,
  Heart,
  ListChecks,
  Medal,
  Milestone,
  Repeat,
  ScrollText,
  Signpost,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

export const LIBRARY_TABS: PageTab[] = [
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Rotation", href: "/rotation", icon: Repeat },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "My Plans", href: "/plans", icon: ListChecks },
  { label: "My Exercises", href: "/my-exercises", icon: Dumbbell },
  { label: "Player Roadmaps", href: "/my-roadmaps", icon: Signpost },
];

export const PROGRESS_TABS: PageTab[] = [
  { label: "Activity", href: "/profile/activity", icon: Activity },
  { label: "Skills", href: "/profile/skill-points", icon: Sparkles },
  { label: "Practice Log", href: "/practice-log", icon: ScrollText },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Milestones", href: "/summary", icon: Milestone },
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
