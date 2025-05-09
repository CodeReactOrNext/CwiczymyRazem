import OldEffect from "components/OldEffect";

import ContentBox from "./components/ContentBox";
import Header from "./components/Header";
import SubtitleBar from "./components/SubtitleBar";

export type layoutVariant = "primary" | "secondary" | "landing";

interface MainLayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: layoutVariant;
}

const MainHeroLayout = ({ children, subtitle, variant }: MainLayoutProps) => {
  return (
    <main className='h-screen  bg-tertiary-bg font-sans 2xl:p-4 '>
      <div className='relative flex h-full w-full items-center justify-center '>
        <div className='relative flex h-full  w-full max-w-[2200px] flex-col overflow-y-auto  overflow-x-hidden  bg-main-opposed-bg scrollbar-hide'>
          <div
            className={`relative  flex h-full  w-full max-w-[2200px] flex-col overflow-x-hidden scrollbar-hide ${
              variant === "secondary" ? "bg-second-600" : "bg-main-opposed-600"
            }`}>
            <Header variant={variant} />
            <SubtitleBar variant={variant}>{subtitle}</SubtitleBar>
            <div className='relative z-10   flex h-full w-full items-center justify-center lg:m-0'>
              {variant !== "landing" && <OldEffect />}
              <ContentBox variant={variant}>{children}</ContentBox>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainHeroLayout;
