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
    <main className='min-h-screen p-4 font-sans lg:p-8'>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`relative h-full max-h-[1080px] w-full max-w-[1920px] overflow-x-hidden scrollbar-hide md:overflow-hidden ${
            variant === "secondary" ? "bg-second-500" : "bg-main-opposed-500"
          }`}>
          <Background variant={variant} />
          {variant !== "landing" && <OldEffect />}
          <ContentBox variant={variant}>{children}</ContentBox>
          <SubtitleBar variant={variant}>{subtitle}</SubtitleBar>
          <Header variant={variant} />
          <LightningDesktopDivider variant={variant} />
        </div>
      </div>
    </main>
  );
}
