import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackLinkProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * The app's one "back" control. A key like every other button (ghost, sm),
 * so going back reads the same on every page instead of as grey text on one,
 * a bare arrow on another and a cyan chip on a third.
 *
 * A solid face, not the ghost's zinc-800/60: on the corridor pages the icon
 * wallpaper showed through it and the key all but vanished.
 */
const baseClass = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "h-9 w-fit bg-zinc-800 px-3.5 text-[13px] text-zinc-100 hover:bg-zinc-700",
);

export const BackLink = ({ label, href, onClick, className }: BackLinkProps) => {
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cn(baseClass, className)}>
        <ArrowLeft />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(baseClass, className)}>
      <ArrowLeft />
      {label}
    </button>
  );
};
