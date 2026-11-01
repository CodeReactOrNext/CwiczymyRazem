// App-only English text; public pages that skip AppLayout never download it.
import "lib/i18n/fullCatalog";

import { selectAutoLogInFailed, selectCurrentUserStats, selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { usePresence } from "hooks/usePresence";
import { AppShellSkeleton } from "layouts/AppLayout/AppShellSkeleton";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { loadSentryReplay } from "lib/sentry/loadSentryReplay";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";

interface AppLayoutProps {
  children: React.ReactNode;
  pageId: NavPagesTypes;
  subtitle?: string; // Kept for compatibility, unused
  variant?: "primary" | "secondary" | "landing" | "fullscreen";
  wide?: boolean;
  isPublic?: boolean;
}

const AppLayout = ({
  children,
  pageId,
  variant = "secondary",
  wide = false,
  isPublic = false,
}: AppLayoutProps) => {
  usePresence();
  const { status } = useSession();
  const router = useRouter();

  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const autoLogInFailed = useAppSelector(selectAutoLogInFailed);

  // userName intentionally NOT required here: accounts with a null displayName
  // in their users doc would otherwise be stuck on the loading screen forever
  // (auth + stats loaded, no redirect fires, nothing ever fills the name).
  const isAuthenticated = !!(userAuth && userStats);

  // Session Replay only inside the logged-in app, never on public pages.
  useEffect(() => {
    if (isAuthenticated) loadSentryReplay();
  }, [isAuthenticated]);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.push("/");
    }
  }, [status, router, isPublic]);

  // If auto login failed, redirect to home instead of showing spinner forever
  useEffect(() => {
    if (autoLogInFailed && !isAuthenticated && !isPublic) {
      router.push("/");
    }
  }, [autoLogInFailed, isAuthenticated, isPublic, router]);

  // Public pages must render their content (and <Head> tags) during SSR/SSG,
  // where session status is always "loading" — otherwise crawlers get an empty page.
  if (isPublic && !isAuthenticated) {
    return <>{children}</>;
  }

  if (status === "loading" || !isAuthenticated) {
    return (
      <>
        {/* What a crawler gets for a logged-in-only page: a skeleton with the
            site-wide default title and description. Keep it out of the index. */}
        {!isPublic && (
          <Head>
            <meta key='robots' name='robots' content='noindex, nofollow' />
          </Head>
        )}
        <AppShellSkeleton />
      </>
    );
  }

  return (
    <MainLoggedLayout
      pageId={pageId}
      variant={variant}
      wide={wide}
      userStats={userStats}
      userName={userName ?? ""}
      userAvatar={userAvatar}>
      {children}
    </MainLoggedLayout>
  );
};

export default AppLayout;
