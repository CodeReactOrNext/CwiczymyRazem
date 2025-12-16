import { selectCurrentUserStats, selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { LandingNavObjectInterface } from "layouts/MainLoggedLayout/components/LandingNav";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { NavPagesTypes } from "types/layout.types";

interface AppLayoutProps {
  children: React.ReactNode;
  pageId: NavPagesTypes;
  subtitle?: string; // Kept for compatibility, unused
  variant?: "primary" | "secondary" | "landing";
}

const AppLayout = ({
  children,
  pageId,
  variant = "secondary",
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
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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
      { id: "songs", name: t("nav.songs"), href: "/songs" },
      { id: "leadboard", name: t("nav.leadboard"), href: "/leaderboard" },
      { id: "faq", name: t("nav.faq"), href: "/faq" },
    ],
  };

  if (!isAuthenticated || status === "loading") {
    // If unauthenticated, the useEffect will trigger redirect.
    // Meanwhile, show loader to prevent content flash or crash.
    // If status is "loading" (next-auth check), show loader.
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
