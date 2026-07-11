import { RockSidebar } from "components/RockSidebar";
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
  return (
    <main className='h-[100dvh] bg-zinc-950 font-sans overflow-hidden'>
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
                <div className='relative w-full h-full'>
                  {children}
                </div>
              </div>
            ) : (
              <div className={`z-20 mx-auto w-full px-0 pb-24 md:pt-8 md:pb-8 lg:px-8 ${wide ? "max-w-[1800px]" : "max-w-[1490px]"}`}>
                  <div className='relative'>
                    {children}
                  </div>
              </div>
            )}
          </MainLoggedWrapper>
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
