import type { SidebarLinkInterface } from "components/RockSidebar";
import { RockSidebar } from "components/RockSidebar";
import { useTranslation } from "hooks/useTranslation";
import { FileText,HelpCircle, Home, Music, Timer, Trophy } from "lucide-react";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "types/layout.types";

import DesktopHeaderWrapper from "./components/DesktopHeaderWrapper";
import type { LandingNavObjectInterface } from "./components/LandingNav/LandingNav";
import MainLoggedWrapper from "./components/MainLoggedWrapper";

import UserHeader from "./components/UserHeader/UserHeader";

interface LandingLayoutProps {
  navigation: LandingNavObjectInterface;
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
  pageId: NavPagesTypes;
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

const MainLoggedLayout = ({
  navigation,
  userStats,
  userName,
  userAvatar,
  children,
  pageId,
}: LandingLayoutProps) => {
  const { t } = useTranslation();

  // Convert navigation to sidebar links
  const sidebarLinks: SidebarLinkInterface[] = [
    {
      id: "profile" as NavPagesTypes,
      name: (t as any)("nav.profile", "Profil"),
      href: "/profile",
      icon: <Home size={20} />,
    },
    {
      id: "timer" as NavPagesTypes,
      name: (t as any)("nav.practice", "Ćwicz"),
      href: "/timer",
      icon: <Timer size={20} />,
    },
    {
      id: "report" as NavPagesTypes,
      name: (t as any)("nav.report", "Raporty"),
      href: "/report",
      icon: <FileText size={20} />,
    },
    ...navigation.leftSideLinks.map((link) => ({
      ...link,
      icon:
        link.name.toLowerCase().includes("utwory") ||
        link.name.toLowerCase().includes("songs") ? (
          <Music size={20} />
        ) : link.name.toLowerCase().includes("leader") ? (
          <Trophy size={20} />
        ) : link.name.toLowerCase().includes("faq") ? (
          <HelpCircle size={20} />
        ) : (
          <Home size={20} />
        ),
    })),
    ...navigation.rightSideLinks.map((link) => ({
      ...link,
      icon:
        link.name.toLowerCase().includes("utwory") ||
        link.name.toLowerCase().includes("songs") ? (
          <Music size={20} />
        ) : link.name.toLowerCase().includes("leader") ? (
          <Trophy size={20} />
        ) : link.name.toLowerCase().includes("faq") ? (
          <HelpCircle size={20} />
        ) : (
          <Home size={20} />
        ),
    })),
  ];

  return (
    <main className='h-[100dvh] bg-zinc-950 font-sans overflow-hidden'>
      {/* Subtle background texture */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_80%)] opacity-20'></div>

      <div className='relative flex h-full w-full'>
        <RockSidebar  pageId={pageId} />

        <div className='relative flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-hide'>
          <MainLoggedWrapper>
            <DesktopHeaderWrapper>
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </DesktopHeaderWrapper>


            <div className='z-20 mx-auto w-full max-w-[1490px] px-0 pb-24 md:pt-8 md:pb-8 lg:px-8'>
                <div
                  className='relative z-10'>
                  {children}
                </div>
            </div>
          </MainLoggedWrapper>
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
