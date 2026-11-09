// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { statisticsInitial } from "constants/userStatisticsInitialData";
import { restoreUserSnapshot } from "feature/user/store/userSlice";
import type { UserSnapshot } from "feature/user/store/userSnapshot";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import type { ComponentType } from "react";
import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "types/layout.types";

const DEMO_STATS: StatisticsDataInterface = {
  ...statisticsInitial,
  lvl: 24,
  points: 5200,
  fame: 48_000,
  // Some practice history, so the Progress charts have something to draw.
  time: {
    technique: 42 * 3_600_000,
    theory: 11 * 3_600_000,
    hearing: 7 * 3_600_000,
    creativity: 15 * 3_600_000,
    longestSession: 2 * 3_600_000,
  },
  habitsCount: 64,
  dayWithoutBreak: 21,
  actualDayWithoutBreak: 12,
  maxPoints: 380,
  // Under the support prompt's threshold, so it does not cover the page.
  sessionCount: 3,
};

interface PreviewPage {
  load: () => Promise<{ default: ComponentType }>;
  pageId: NavPagesTypes;
  variant?: "primary" | "secondary";
  wide?: boolean;
}

/** The real page components, rendered inside the shell instead of AppLayout. */
const PAGES: Record<string, PreviewPage> = {
  journey: { load: () => import("../journey"), pageId: "journey" },
  songs: { load: () => import("../songs"), pageId: "songs", variant: "primary", wide: true },
  recordings: { load: () => import("../recordings"), pageId: "recordings" },
  practiceLog: { load: () => import("../practice-log"), pageId: "profile" },
  leaderboard: { load: () => import("../leaderboard"), pageId: "profile" },
  seasons: { load: () => import("../seasons"), pageId: "profile" },
  guilds: { load: () => import("../guilds"), pageId: "profile" },
  duels: { load: () => import("../duels"), pageId: "profile" },
  challenges: { load: () => import("../challenges"), pageId: "profile" },
  bosses: { load: () => import("../bosses"), pageId: "profile" },
  settings: { load: () => import("../settings"), pageId: "profile" },
  calendar: { load: () => import("../calendar"), pageId: "profile" },
  favorites: { load: () => import("../favorites"), pageId: "profile" },
  goals: { load: () => import("../goals"), pageId: "profile" },
  rotation: { load: () => import("../rotation"), pageId: "profile" },
  timer: { load: () => import("../timer"), pageId: "profile" },
  profile: { load: () => import("../profile"), pageId: "profile" },
  activity: { load: () => import("../profile/activity"), pageId: "profile" },
  skills: { load: () => import("../profile/skills"), pageId: "profile" },
  achievements: { load: () => import("../profile/achievements"), pageId: "profile" },
  myExercises: { load: () => import("../my-exercises"), pageId: "profile" },
  plans: { load: () => import("../timer/plans"), pageId: "profile" },
  freeTimer: { load: () => import("../timer/practice"), pageId: "profile" },
  autoPlan: { load: () => import("../timer/auto"), pageId: "profile" },
  scaleTree: { load: () => import("../scale-tree"), pageId: "profile" },
  myRoadmaps: { load: () => import("../my-roadmaps"), pageId: "profile" },
  summary: { load: () => import("../summary"), pageId: "profile" },
  roadmap: { load: () => import("../roadmap"), pageId: "profile" },
  supporter: { load: () => import("../supporter"), pageId: "profile" },
  next: { load: () => import("../next"), pageId: "profile" },
};

const LOADED: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(PAGES).map(([key, page]) => [key, dynamic(page.load, { ssr: false })]),
);

/**
 * Dev-only: a logged-in page inside the app shell without signing in, for
 * layout and theme checks — `?page=<key of PAGES>` (songs takes `&view=` like
 * /songs). A fake uid, so private data comes back empty; public data (song
 * library, recordings, feeds, rankings) loads. Renders nothing outside
 * development.
 */
export default function ShellPreviewPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useState(() => {
    dispatch(
      restoreUserSnapshot({
        userAuth: "dev-shell-preview",
        // feedbackAskedAt: keeps the feedback survey from covering the page.
        userInfo: { displayName: "Riffer", feedbackAskedAt: Date.now() } as unknown as UserSnapshot["userInfo"],
        currentUserStats: DEMO_STATS,
      }),
    );
    return true;
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const key = (router.query.page as string) || "journey";
  const page = PAGES[key] ?? PAGES.journey;
  const Page = LOADED[key] ?? LOADED.journey;

  return (
    <MainLoggedLayout
      pageId={page.pageId}
      variant={page.variant ?? "secondary"}
      wide={page.wide}
      userStats={DEMO_STATS}
      userName='Riffer'>
      <Page />
    </MainLoggedLayout>
  );
}
