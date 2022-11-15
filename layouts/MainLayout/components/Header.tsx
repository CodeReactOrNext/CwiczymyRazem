import Logo from "components/Logo";
import Navigation from "./Navigation";

export default function Header({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div className='absolute flex h-20 w-full items-center justify-between pl-8'>
      <Logo />
      <Navigation variant={variant} />
    </div>
  );
}
