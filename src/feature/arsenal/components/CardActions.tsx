import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Children, createContext, useContext } from "react";

/**
 * The merge key of an item card: what it would add, and whether it can be pressed.
 * Absent on a card whose model the player holds only once — there is nothing to
 * fold it into, so the key would only ever be disabled.
 */
export interface CardMergeAction {
  /** Item Level points the merge adds to the copy it lands on. */
  gain: number;
  disabled?: boolean;
  /** Why it is disabled, said in the key's own tooltip. */
  reason?: string;
  onClick: () => void;
}

type CardActionLayout = "inline" | "key" | "wide";

/**
 * How the keys in a row are cut, set by the row rather than by each key — a row
 * is one shape, and twelve call sites each passing it would drift apart.
 */
const LayoutContext = createContext<CardActionLayout>("inline");

const ROW = "flex flex-shrink-0 gap-1.5 bg-black/40 p-2";

interface CardActionRowProps {
  children?: ReactNode;
  /**
   * The card's main action, on a row of its own above the rest. Its presence
   * also turns the rest into keys — see `keys`.
   */
  primary?: ReactNode;
  /**
   * Glyph over a short label instead of the two side by side. Five or six
   * actions side by side on a card 250px wide left about forty pixels each, and
   * "Market" or "Scrap" cut off mid-word; stacked, every label fits.
   */
  keys?: boolean;
  className?: string;
}

/**
 * The strip of actions along the bottom of an item card.
 *
 * A band of darker floor with the actions sitting on it as separate keys —
 * rather than one bar sliced up by hairlines, which is what it used to be. The
 * card is already a frame; a second set of lines inside it only made the row
 * read as a table footer.
 *
 * With a `primary`, the band splits in two: the action the card is for on top,
 * full width, and everything that sends the item away underneath. Six equal keys
 * said every action mattered the same, and Equip is the one a player is there
 * for nearly every time.
 */
export const CardActionRow = ({
  children,
  primary,
  keys = false,
  className,
}: CardActionRowProps) => {
  const stacked = keys || primary != null;
  const hasKeys = Children.toArray(children).length > 0;

  if (!stacked) {
    return <div className={cn(ROW, className)}>{children}</div>;
  }

  return (
    <div className={cn(ROW, "flex-col", className)}>
      {primary != null && (
        <LayoutContext.Provider value='wide'>
          <div className='flex'>{primary}</div>
        </LayoutContext.Provider>
      )}
      {hasKeys && (
        <LayoutContext.Provider value='key'>
          <div className='flex gap-1.5'>{children}</div>
        </LayoutContext.Provider>
      )}
    </div>
  );
};

/**
 * Tones say what an action costs the player, not what it is called: taking a
 * pedal off the board is neutral, a sale is money, a scrap is a teardown, and
 * anything red is gone for good. Colour only lands on hover — three tinted keys
 * sitting there permanently would shout over the item itself.
 */
const cardAction = cva(
  "flex items-center justify-center rounded-lg bg-zinc-800/40 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-30",
  {
    variants: {
      layout: {
        inline: "h-8 flex-1 gap-1.5 text-[11px] tracking-wide",
        /** A key of the lower row: glyph over label, so every label fits. */
        key: "h-12 min-w-0 flex-1 flex-col gap-1 px-0.5 text-[10px] tracking-wide",
        /** The card's main action, alone on the top row. */
        wide: "h-10 w-full gap-2 text-sm",
      },
      tone: {
        neutral:
          "text-zinc-300 enabled:hover:bg-zinc-700/60 enabled:hover:text-white",
        /** The card's main action — the app's primary CTA is white. */
        primary: "bg-zinc-100 font-bold text-zinc-900 enabled:hover:bg-white",
        market:
          "text-zinc-400 enabled:hover:bg-amber-500/15 enabled:hover:text-amber-300",
        /** Given to the guild stash — paid in honor, which is purple wherever it is counted. */
        guild:
          "text-zinc-400 enabled:hover:bg-purple-500/15 enabled:hover:text-purple-300",
        scrap:
          "text-zinc-400 enabled:hover:bg-orange-500/15 enabled:hover:text-orange-300",
        /** Folds a duplicate into the copy you keep — progress, so emerald. */
        merge:
          "text-zinc-400 enabled:hover:bg-emerald-500/15 enabled:hover:text-emerald-300",
        sell: "text-zinc-400 enabled:hover:bg-red-500/15 enabled:hover:text-red-300",
        /** The state this action already put the item in — equipped, on board. */
        active: "bg-amber-500/15 text-amber-300 enabled:hover:bg-amber-500/25",
      },
    },
    defaultVariants: { layout: "inline", tone: "neutral" },
  },
);

const ICON_SIZE: Record<CardActionLayout, number> = {
  inline: 12,
  key: 15,
  wide: 15,
};

interface CardActionProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof cardAction>, "layout"> {
  /** Sized here, not by the caller — every key in the row carries the same glyph. */
  icon?: LucideIcon;
}

/** One key of `CardActionRow`. Splits its row evenly with its siblings. */
export const CardAction = ({
  tone,
  icon: Icon,
  children,
  className,
  ...props
}: CardActionProps) => {
  const layout = useContext(LayoutContext);

  return (
    <button
      type='button'
      className={cn(cardAction({ layout, tone }), className)}
      {...props}>
      {Icon && (
        <Icon
          size={ICON_SIZE[layout]}
          strokeWidth={2.25}
          className='shrink-0'
        />
      )}
      {/* A stacked label is clipped rather than wrapped — the key's height is
          what keeps the row one even band. */}
      {layout === "key" ? (
        <span className='max-w-full truncate leading-none'>{children}</span>
      ) : (
        children
      )}
    </button>
  );
};
