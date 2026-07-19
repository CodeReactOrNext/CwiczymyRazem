import type { PageTab } from "components/PageTabs/PageTabs";

export const LIBRARY_TABS: PageTab[] = [
  { label: "Favorites", href: "/favorites" },
  { label: "My Plans", href: "/plans" },
  { label: "My Exercises", href: "/my-exercises" },
];

export const PROGRESS_TABS: PageTab[] = [
  { label: "Activity", href: "/profile/activity" },
  { label: "Practice Log", href: "/practice-log" },
];

export const LEADERBOARD_TABS: PageTab[] = [
  { label: "Seasons", href: "/seasons" },
  { label: "Leaderboard", href: "/leaderboard" },
  {
    label: "Gear",
    href: "/leaderboard/gear",
    tooltip: "Ranked by equipped guitar & rig level, not practice score",
  },
];
