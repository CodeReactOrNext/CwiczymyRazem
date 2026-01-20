
import ContentBox from "./components/ContentBox";

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
