import Logo from "components/Logo";
import Navigation from "./Navigation";

export default function Header() {
  return (
    <div className='absolute flex h-20 w-full items-center justify-between px-8'>
      <Logo />
      <Navigation />
    </div>
  );
}
