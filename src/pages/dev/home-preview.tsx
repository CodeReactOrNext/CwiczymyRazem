// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { statisticsInitial } from "constants/userStatisticsInitialData";
import { restoreUserSnapshot } from "feature/user/store/userSlice";
import type { UserSnapshot } from "feature/user/store/userSnapshot";
import LandingView from "feature/user/view/LandingView";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";

const DEMO_STATS: StatisticsDataInterface = {
  ...statisticsInitial,
  lvl: 24,
  points: 5200,
  fame: 48_000,
  actualDayWithoutBreak: 12,
  maxPoints: 380,
  // Under the support prompt's threshold, so it does not cover the page.
  sessionCount: 3,
};

/**
 * Dev-only: Home (/dashboard) inside the app shell without signing in, for
 * layout and theme checks. A fake uid, so anything read from Firestore comes
 * back empty — the page shows its empty states. Renders nothing outside
 * development.
 */
export default function HomePreviewPage() {
  const dispatch = useAppDispatch();
  // Before the first render, so LandingView never sits on its spinner.
  useState(() => {
    dispatch(
      restoreUserSnapshot({
        userAuth: "dev-home-preview",
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

  return (
    <MainLoggedLayout
      pageId='profile'
      variant='secondary'
      userStats={DEMO_STATS}
      userName='Riffer'>
      <LandingView />
    </MainLoggedLayout>
  );
}
