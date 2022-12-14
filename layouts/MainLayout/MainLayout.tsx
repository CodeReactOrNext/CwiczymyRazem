import Header from "./components/Header";
import OldEffect from "components/OldEffect";
import Background from "./components/Background";
import ContentBox from "./components/ContentBox";
import SubtitleBar from "./components/SubtitleBar";
import LightningDesktopDivider from "./components/LightningDesktopDivider";

export type layoutVariant = "primary" | "secondary" | "landing";

interface LayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: layoutVariant;
}

const MainLayout = ({ children, subtitle, variant }: LayoutProps) => {
  return (
    <main className='h-screen min-h-[650px] p-4 font-sans xs:min-h-[950px] lg:p-8'>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`relative  flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-x-hidden scrollbar-hide ${
            variant === "secondary" ? "bg-second-500" : "bg-main-opposed-500"
          }`}>
          <Header variant={variant} />
          <SubtitleBar variant={variant}>{subtitle}</SubtitleBar>
          <div className='relative -mt-[5.5%] flex h-full w-full items-center justify-center lg:m-0'>
            <Background variant={variant} />
            <LightningDesktopDivider variant={variant} />
            <ContentBox variant={variant}>{children}</ContentBox>
          </div>
          {variant !== "landing" && <OldEffect />}
        </div>
      </div>
    </main>
  );
};

export default MainLayout;
