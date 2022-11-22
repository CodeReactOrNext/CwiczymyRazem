import Header from "./components/Header";
import OldEffect from "components/OldEffect";
import Background from "./components/Background";
import ContentBox from "./components/ContentBox";
import SubtitleBar from "./components/SubtitleBar";
import LightningDesktopDivider from "./components/LightningDesktopDivider";

interface LayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: "primary" | "secondary" | "landing";
}

export default function Layout({ children, subtitle, variant }: LayoutProps) {
  return (
    <main className='h-screen p-4 font-sans lg:p-8'>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-x-hidden scrollbar-hide ${
            variant === "secondary" ? "bg-second-500" : "bg-main-opposed-500"
          }`}>
          <Header variant={variant} />
          {/* {variant !== "landing" && <OldEffect />} */}
          <SubtitleBar variant={variant}>{subtitle}</SubtitleBar>
          <div className='relative flex h-full w-full items-center justify-center'>
            <Background variant={variant} />
            <LightningDesktopDivider variant={variant} />
            <ContentBox variant={variant}>{children}</ContentBox>
          </div>
        </div>
      </div>
    </main>
  );
}
