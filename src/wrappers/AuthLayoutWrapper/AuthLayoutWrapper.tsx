import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import MainLayout from "layouts/MainLayout";
import { layoutVariant } from "layouts/MainLayout/MainLayout";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { LandingNavObjectInterface } from "layouts/MainLoggedLayout/components/LandingNav";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";

export type NavPagesTypes =
  | "profile"
  | "exercise"
  | "report"
  | "leadboard"
  | "faq"
  | "songs"
  | null;

interface AuthLayoutWrapperProps {
  children: React.ReactNode;
  subtitle: string;
  pageId: NavPagesTypes;
  variant: layoutVariant;
}

const AuthLayoutWrapper = ({
  children,
  subtitle,
  pageId,
  variant,
}: AuthLayoutWrapperProps) => {
  const { t } = useTranslation("common");
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const userLoggedIn = userAuth && userStats && userName;

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

  return userLoggedIn ? (
    <MainLoggedLayout
      pageId={pageId}
      variant={variant}
      navigation={navigation}
      userStats={userStats}
      userName={userName}
      userAvatar={userAvatar}>
      {children}
    </MainLoggedLayout>
  ) : (
    <MainLayout subtitle={subtitle} variant={variant}>
      {children}
    </MainLayout>
  );
};

export default AuthLayoutWrapper;
