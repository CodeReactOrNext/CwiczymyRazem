import { cn } from "assets/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackLinkProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const baseClass =
  "inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const BackLink = ({ label, href, onClick, className }: BackLinkProps) => {
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cn(baseClass, className)}>
        <ArrowLeft size={16} />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(baseClass, className)}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};
