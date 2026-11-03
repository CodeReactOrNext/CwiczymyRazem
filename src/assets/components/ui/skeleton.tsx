import { cn } from "assets/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Two tones, so every placeholder in the app reads the same way:
 * - `line` — text, an icon or a control, drawn on a card or on the page.
 * - `block` — stands in for a whole card, in the card's own background
 *   (`bg-zinc-900/40`), so when the card arrives only its contents appear,
 *   not a new shape.
 */
const skeletonVariants = cva("animate-pulse", {
  variants: {
    variant: {
      line: "rounded-md bg-zinc-800/60",
      block: "rounded-lg bg-zinc-900/40",
    },
  },
  defaultVariants: { variant: "line" },
})

function Skeleton({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) {
  return (
    <div className={cn(skeletonVariants({ variant }), className)} {...props} />
  )
}

export { Skeleton }
