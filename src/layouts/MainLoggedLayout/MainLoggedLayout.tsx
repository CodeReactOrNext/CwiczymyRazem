import { RockSidebar } from "components/RockSidebar";
import { CommunityDrawer } from "feature/logsBox/components/CommunityDrawer";
import { m, useReducedMotion } from "framer-motion";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { LocalizedRegion } from "lib/i18n/LocalizedRegion";
import { transitions } from "lib/motion/motion";
import { useRouter } from "next/router";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "types/layout.types";

import DesktopHeaderWrapper from "./components/DesktopHeaderWrapper";
import MainLoggedWrapper from "./components/MainLoggedWrapper";
import UserHeader from "./components/UserHeader/UserHeader";

interface LandingLayoutProps {
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
  pageId: NavPagesTypes;
  variant: "primary" | "secondary" | "landing" | "fullscreen";
  wide?: boolean;
  children: React.ReactNode;
}

const MainLoggedLayout = ({
  userStats,
  userName,
  userAvatar,
  children,
  pageId,
  variant,
  wide = false,
}: LandingLayoutProps) => {
  const { isElectron } = useElectronWindowControls();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // A short fade as a new page takes over the content area — enter only, so it
  // never holds the old page back. Opacity alone: a transform would turn this
  // wrapper into the containing block of every `position: fixed` inside the page.
  // Keyed by route, which remounts nothing extra: a new route is a new page
  // component anyway.
  const pageEnter = {
    initial: reduceMotion ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: transitions.fast,
  } as const;

  return (
    // The language picked in Settings applies to everything inside this shell and
    // to nothing outside it — the public pages stay English. See LocalizedRegion.
    <LocalizedRegion>
      <main
        data-app-shell
        className={`bg-zinc-950 font-sans overflow-hidden ${
          isElectron ? "h-[calc(100dvh-2.5rem)]" : "h-[100dvh]"
        }`}>
        {/* Subtle background texture */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_80%)] opacity-20'></div>

        <div className='relative flex h-full w-full'>
          <RockSidebar  pageId={pageId} />

          <div className='relative flex h-full flex-1 flex-col overflow-hidden'>
            <MainLoggedWrapper>
              <DesktopHeaderWrapper>
                <UserHeader
                  avatar={userAvatar}
                  userStats={userStats}
                  userName={userName}
                />
              </DesktopHeaderWrapper>


              {variant === "fullscreen" ? (
                <div className='z-20 w-full flex-1 h-full'>
                  <m.div key={router.pathname} className='relative w-full h-full' {...pageEnter}>
                    {children}
                  </m.div>
                </div>
              ) : (
                <div className={`z-20 mx-auto w-full px-0 pb-24 md:pt-8 md:pb-8 lg:px-8 ${wide ? "max-w-[1800px]" : "max-w-[1490px]"}`}>
                    <m.div key={router.pathname} className='relative' {...pageEnter}>
                      {children}
                    </m.div>
                </div>
              )}
            </MainLoggedWrapper>
          </div>
        </div>

        <CommunityDrawer />
      </main>
    </LocalizedRegion>
  );
};

export default MainLoggedLayout;
