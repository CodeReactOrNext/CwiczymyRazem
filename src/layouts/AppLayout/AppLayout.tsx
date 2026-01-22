import { selectCurrentUserStats, selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import type { LandingNavObjectInterface } from "layouts/MainLoggedLayout/components/LandingNav";
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
  variant?: "primary" | "secondary" | "landing";
  isPublic?: boolean;
}

const AppLayout = ({
  children,
  pageId,
  variant = "secondary",
  isPublic = false,
}: AppLayoutProps) => {
  const { t } = useTranslation("common");
  const { status } = useSession();
  const router = useRouter();

  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const isAuthenticated = !!(userAuth && userStats && userName);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.push("/");
    }
  }, [status, router, isPublic]);

  const navigation: LandingNavObjectInterface = {
    leftSideLinks: [
      {
        id: "profile",
        name: t("nav.profile"),
        href: "/",
      },
      {
        id: "exercise",
        name: t("nav.exercise"),
        href: "/timer",
      },
      { id: "report", name: t("nav.report"), href: "/report" },
    ],
    rightSideLinks: [
      { id: "library", name: "Library", href: "/songs?view=library" },
      { id: "my_songs", name: "My Songs", href: "/songs?view=management" },
      { id: "leadboard", name: t("nav.leadboard"), href: "/leaderboard" },
      { id: "faq", name: t("nav.faq"), href: "/faq" },
    ],
  };

  if (status === "loading") {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
             <PageLoadingLayout />
        </div>
    );
  }

  if (!isAuthenticated) {
    if (isPublic) {
      return <>{children}</>;
    }
    
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
      navigation={navigation}
      userStats={userStats}
      userName={userName}
      userAvatar={userAvatar}>
      {children}
    </MainLoggedLayout>
  );
};

export default AppLayout;
