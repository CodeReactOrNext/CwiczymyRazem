import { RockSidebar } from "components/RockSidebar";
import type { SidebarLinkInterface } from "components/RockSidebar";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Home, Music, Trophy, HelpCircle, Timer, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "wrappers/AuthLayoutWrapper";

import DesktopHeaderWrapper from "./components/DesktopHeaderWrapper";
import LandingNav from "./components/LandingNav";
import type { LandingNavObjectInterface } from "./components/LandingNav/LandingNav";
import MainLoggedWrapper from "./components/MainLoggedWrapper";
import MobileHeaderWrapper from "./components/MobileHeaderWrapper";
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
    <main className='h-screen bg-zinc-950 font-sans'>
      {/* Subtle background texture */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_80%)] opacity-20'></div>

      <div className='relative flex h-full w-full'>
        <RockSidebar links={sidebarLinks} pageId={pageId} />

        <div className='relative flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-hide'>
          <MainLoggedWrapper>
            <DesktopHeaderWrapper>
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </DesktopHeaderWrapper>
            <MobileHeaderWrapper>
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </MobileHeaderWrapper>

            <div className='z-20 mx-auto w-full max-w-[1490px] px-6 py-8 lg:px-8'>
              <AnimatePresence mode='wait'>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className='relative z-10'>
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </MainLoggedWrapper>
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
