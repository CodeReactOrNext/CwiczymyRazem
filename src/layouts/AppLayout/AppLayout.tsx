import { selectAutoLogInFailed, selectCurrentUserStats, selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { usePresence } from "hooks/usePresence";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
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

  const isAuthenticated = !!(userAuth && userStats && userName);

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

  if (status === "loading") {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
             <PageLoadingLayout />
        </div>
    );
  }

  if (!isAuthenticated) {

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
             <PageLoadingLayout />
        </div>
    );
  }

  return (
    <MainLoggedLayout
      pageId={pageId}
      variant={variant}
      wide={wide}
      userStats={userStats}
      userName={userName}
      userAvatar={userAvatar}>
      {children}
    </MainLoggedLayout>
  );
};

export default AppLayout;
