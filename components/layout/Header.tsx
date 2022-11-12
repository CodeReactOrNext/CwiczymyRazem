import MainNavigation from "./MainNavigation";

export default function Header() {
  return (
    <div className='absolute flex h-20 w-full items-center justify-between px-8'>
      <div>LOGO</div>
      <MainNavigation />
    </div>
  );
}
