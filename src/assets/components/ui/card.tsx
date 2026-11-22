import { cn } from "assets/lib/utils";
import * as React from "react";

/**
 * The padding is split by breakpoint (`p-5 sm:p-6`), and tailwind-merge only
 * swaps a caller's unprefixed `p-*` for the unprefixed one — the `sm:p-6` would
 * stay and win from 640px up (a `p-0` media card would grow a frame on
 * desktop). A caller that sets any padding of its own gets only that.
 */
const hasOwnPadding = (className?: string) =>
  /(^|\s)!?p[xytrblse]?-/.test(className ?? "");

const CARD_PADDING = {
  /** Section cards, widgets, settings panels. */
  default: "p-5 sm:p-6",
  /** Dense tiles and list rows where the roomy padding would crowd the content. */
  sm: "p-4",
} as const;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof CARD_PADDING;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, size = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-zinc-800/40 text-card-foreground",
        !hasOwnPadding(className) && CARD_PADDING[size],
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

// Header, content and footer carry no padding of their own: the Card pads,
// so nesting them never stacks a second frame of whitespace inside it.
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
