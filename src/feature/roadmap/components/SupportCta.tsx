import { cn } from "assets/lib/utils";
import { Coffee } from "lucide-react";
import type { ReactNode } from "react";

import { BMC_URL } from "../data/roadmap.data";

interface SupportCtaProps {
  className?: string;
  children?: ReactNode;
}

/**
 * The one action on the page. Same white button the HeroBanner and the
 * dashboard SupportBanner use, so wherever it is repeated it reads as the
 * primary thing to do and not as another tinted panel.
 */
export const SupportCta = ({
  className,
  children = "Support Riff Quest",
}: SupportCtaProps) => (
  <a
    href={BMC_URL}
    target='_blank'
    rel='noopener noreferrer'
    className={cn(
      "flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60 hover:bg-white",
      className,
    )}>
    <Coffee size={16} />
    {children}
  </a>
);
