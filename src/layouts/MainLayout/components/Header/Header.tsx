import Logo from "components/Logo";
import MainNavigation from "components/MainNavigation";
import type { layoutVariant } from "layouts/MainLayout/MainLayout";

interface HeaderProps {
  variant: layoutVariant;
}
const Header = ({ variant }: HeaderProps) => {
  return (
    <div className='top-0 left-0 z-40 flex h-20 min-h-[5rem] w-full items-center justify-between pl-8'>
      <Logo />
      <MainNavigation variant={variant} />
    </div>
  );
};

export default Header;
