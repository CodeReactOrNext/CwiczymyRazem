// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import MainContainer from "components/MainContainer";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import JourneyView from "feature/journey/view/JourneyView";
import RecordingsView from "feature/recordings/components/RecordingsView";
import SongsView from "feature/songs/SongsView";
import { restoreUserSnapshot } from "feature/user/store/userSlice";
import type { UserSnapshot } from "feature/user/store/userSnapshot";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "types/layout.types";

const DEMO_STATS: StatisticsDataInterface = {
  ...statisticsInitial,
  lvl: 24,
  points: 5200,
  fame: 48_000,
  // Under the support prompt's threshold, so it does not cover the page.
  sessionCount: 3,
};

/**
 * Dev-only: a logged-in page inside the app shell without signing in, for
 * layout and theme checks — `?page=journey|songs|recordings` (songs takes
 * `&view=` like /songs). A fake uid, so private data comes back empty; public
 * data (song library, recordings feed) loads. Renders nothing outside
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

  const page = (router.query.page as string) || "journey";
  const view = (router.query.view as string) || "board";
  const pageId: NavPagesTypes =
    page === "songs" ? "songs" : page === "recordings" ? "recordings" : "journey";

  return (
    <MainLoggedLayout
      pageId={pageId}
      variant={page === "songs" ? "primary" : "secondary"}
      wide={page === "songs"}
      userStats={DEMO_STATS}
      userName='Riffer'>
      {page === "songs" ? (
        <MainContainer noBorder>
          <SongsView view={view} initialSongId='' />
        </MainContainer>
      ) : page === "recordings" ? (
        <RecordingsView />
      ) : (
        <JourneyView />
      )}
    </MainLoggedLayout>
  );
}
