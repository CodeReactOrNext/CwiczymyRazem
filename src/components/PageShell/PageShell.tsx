import { cn } from "assets/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";

/** Side gutters of a logged-in page — the same on every screen. */
export const PAGE_GUTTER = "px-6 md:px-8 lg:px-10";

/** The content block under the hero: gutters plus breathing room top and bottom. */
export const PAGE_CONTENT = cn(PAGE_GUTTER, "pb-16 pt-6");

// The frame is translucent, so a second one inside it (a page that wraps a
// layout which brings its own `MainContainer`) would paint a lighter box.
const InsidePageShell = createContext(false);

interface PageShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
}

/**
 * The frame every logged-in page sits in, under and around its hero. Only a
 * background — no border, line or shadow — so it reads as one surface over the
 * zinc-950 page and turns into a white card in the light theme. Nested inside
 * another frame it is only a flex column.
 */
export const PageShell = ({
  children,
  className,
  as: Tag = "div",
  ...rest
}: PageShellProps) => {
  const isNested = useContext(InsidePageShell);

  return (
    <Tag
      {...rest}
      className={cn(
        isNested
          ? "flex flex-col"
          : "flex flex-col overflow-visible rounded-lg bg-zinc-900/60 md:min-h-[calc(100dvh-8rem)]",
        className
      )}>
      <InsidePageShell.Provider value={true}>{children}</InsidePageShell.Provider>
    </Tag>
  );
};
