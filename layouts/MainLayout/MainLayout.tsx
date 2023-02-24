import Header from "./components/Header";
import OldEffect from "components/OldEffect";
import Background from "./components/Background";
import ContentBox from "./components/ContentBox";
import SubtitleBar from "./components/SubtitleBar";
import LightningDesktopDivider from "./components/LightningDesktopDivider";

export type layoutVariant = "primary" | "secondary" | "landing";

interface MainLayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: layoutVariant;
  minHeightLimit?: boolean;
}

const MainLayout = ({
  children,
  subtitle,
  variant,
  minHeightLimit = false,
}: MainLayoutProps) => {
  return (
    <main
      className={`h-screen bg-tertiary-bg  font-sans lg:min-h-[640px] xl:p-4
      ${minHeightLimit ? "min-h-[650px] " : ""}`}>
      <div className='relative flex h-full w-full items-center justify-center '>
        <div
          className={`relative  flex h-full max-h-[calc(1200px_-_4rem)] w-full max-w-[2200px] flex-col overflow-x-hidden scrollbar-hide ${
            variant === "secondary" ? "bg-second-500" : "bg-main-opposed-500"
          }`}>
          <Header variant={variant} />
          <SubtitleBar variant={variant}>{subtitle}</SubtitleBar>
          <div className='relative z-10  -mt-[5.5%] flex h-full w-full items-center justify-center lg:m-0'>
            <Background variant={variant} />
            <LightningDesktopDivider variant={variant} />
            {variant !== "landing" && <OldEffect />}
            <ContentBox variant={variant}>{children}</ContentBox>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainLayout;
