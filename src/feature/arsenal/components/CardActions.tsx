import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/**
 * The strip of actions along the bottom of an item card.
 *
 * A band of darker floor with the actions sitting on it as separate keys —
 * rather than one bar sliced up by hairlines, which is what it used to be. The
 * card is already a frame; a second set of lines inside it only made the row
 * read as a table footer.
 */
export const CardActionRow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-shrink-0 gap-1.5 bg-black/40 p-2", className)}>
    {children}
  </div>
);

/**
 * Tones say what an action costs the player, not what it is called: taking a
 * pedal off the board is neutral, a sale is money, a scrap is a teardown, and
 * anything red is gone for good. Colour only lands on hover — three tinted keys
 * sitting there permanently would shout over the item itself.
 */
const cardAction = cva(
  "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-800/40 text-[11px] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-30",
  {
    variants: {
      tone: {
        neutral:
          "text-zinc-300 enabled:hover:bg-zinc-700/60 enabled:hover:text-white",
        market:
          "text-zinc-400 enabled:hover:bg-amber-500/15 enabled:hover:text-amber-300",
        scrap:
          "text-zinc-400 enabled:hover:bg-orange-500/15 enabled:hover:text-orange-300",
        sell: "text-zinc-400 enabled:hover:bg-red-500/15 enabled:hover:text-red-300",
        /** The state this action already put the item in — equipped, on board. */
        active: "bg-amber-500/15 text-amber-300 enabled:hover:bg-amber-500/25",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

interface CardActionProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cardAction> {
  /** Sized here, not by the caller — every key in the row carries the same glyph. */
  icon?: LucideIcon;
}

/** One key of `CardActionRow`. Splits the row evenly with its siblings. */
export const CardAction = ({
  tone,
  icon: Icon,
  children,
  className,
  ...props
}: CardActionProps) => (
  <button
    type='button'
    className={cn(cardAction({ tone }), className)}
    {...props}>
    {Icon && <Icon size={12} strokeWidth={2.25} />}
    {children}
  </button>
);
