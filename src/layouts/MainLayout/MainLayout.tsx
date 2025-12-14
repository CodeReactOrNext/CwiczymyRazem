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
    <main className='h-screen '>
              <ContentBox variant={variant}>{children}</ContentBox>
    
    </main>
  );
};

export default MainHeroLayout;
