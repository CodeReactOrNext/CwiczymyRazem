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
 */
const baseClass = cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit");

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
