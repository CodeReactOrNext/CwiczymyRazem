import Logo from "components/Logo";
import Navigation from "./Navigation";

export default function Header({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div className='top-0 left-0 z-30 flex h-20 min-h-[5rem] w-full items-center justify-between pl-8'>
      <Logo />
      <Navigation variant={variant} />
    </div>
  );
}
