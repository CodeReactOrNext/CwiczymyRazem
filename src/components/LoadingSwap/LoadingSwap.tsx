import { m } from "framer-motion";
import { transitions } from "lib/motion/motion";
import type { ReactNode } from "react";
import { useState } from "react";

interface LoadingSwapProps {
  isLoading: boolean;
  /** Shown while loading — shaped like the content it stands in for. */
  skeleton: ReactNode;
  /** A function when the content reads data that only exists once loaded. */
  children: ReactNode | (() => ReactNode);
  className?: string;
}

/**
 * The one way a placeholder gives way to content: the skeleton, then the
 * content fading in (`base`) instead of cutting in. Content that is already
 * there on mount — from the cache, on a return visit — appears with the page
 * and does not fade a second time.
 */
export const LoadingSwap = ({
  isLoading,
  skeleton,
  children,
  className,
}: LoadingSwapProps) => {
  // Whether this mount started on the placeholder. Fixed for its lifetime: a
  // background refetch later on never fades the content again.
  const [startedLoading] = useState(isLoading);

  if (isLoading) return <>{skeleton}</>;

  return (
    <m.div
      className={className}
      initial={startedLoading ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={transitions.base}>
      {typeof children === "function" ? children() : children}
    </m.div>
  );
};
