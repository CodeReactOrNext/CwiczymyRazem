import { cn } from "assets/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: ReactNode;
  /** One line under the title saying what the section is for. */
  description?: ReactNode;
  /** Sits on the right: a "see all" link, a button, a filter. */
  action?: ReactNode;
  /** A number after the title, e.g. how many items the section holds. */
  count?: ReactNode;
  /** `lg` for the top-level sections of a page (profile, guild), `default` for cards. */
  size?: "default" | "lg";
  /** Keep the document outline right: `h2` under the page title, `h3` inside a card. */
  as?: "h2" | "h3";
  className?: string;
}

/** Title typography, for the rare header that cannot be a heading (e.g. inside a button). */
export const SECTION_TITLE_CLASSES = {
  default: "text-base font-semibold text-zinc-100",
  lg: "text-lg font-semibold text-zinc-100",
} as const;

/**
 * The one way a section or card names itself: a plain title, optionally a
 * count and a line of description, and an action on the right. No dots, bars,
 * eyebrows or tracking — the title alone carries the hierarchy.
 */
export const SectionHeader = ({
  title,
  description,
  action,
  count,
  size = "default",
  as: Heading = "h2",
  className,
}: SectionHeaderProps) => {
  const heading = (
    <Heading className={SECTION_TITLE_CLASSES[size]}>
      {title}
      {count !== undefined && count !== null && (
        <span className='ml-2 text-sm font-medium tabular-nums text-zinc-500'>
          {count}
        </span>
      )}
    </Heading>
  );

  return (
    <div
      className={cn(
        "mb-4 flex justify-between gap-3",
        description ? "items-start" : "items-center",
        className,
      )}>
      {description ? (
        <div className='min-w-0'>
          {heading}
          <p className='mt-1 text-sm text-zinc-400'>{description}</p>
        </div>
      ) : (
        heading
      )}
      {action}
    </div>
  );
};

interface SectionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** "See all" in the corner of a section — text only, so it never competes with the numbers. */
export const SectionLink = ({ href, children, className }: SectionLinkProps) => (
  <Link
    href={href}
    className={cn(
      "flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:text-zinc-100",
      className,
    )}>
    {children}
    <ArrowRight size={12} />
  </Link>
);
