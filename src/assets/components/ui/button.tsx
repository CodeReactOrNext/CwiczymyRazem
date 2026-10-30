import { Slot } from "@radix-ui/react-slot";
import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

/**
 * Game-style key: a 3px bottom border forms the lip, and a press sinks the face
 * 2px onto it, leaving 1px of lip, like a key going down.
 *
 * A border rather than a shadow: the background paints under it, so a
 * translucent black tint darkens whatever colour the face is (a caller's bg-*
 * included); with border-box sizing it stays inside the button's height; and
 * the label centres on the face above it, not on the whole box. All of it is
 * classes, so a Link styled with buttonVariants() presses the same way.
 *
 * The press never touches layout: the whole button moves 2px and the clip cuts
 * the 2px that would hang below, so the bottom edge stays put while the face
 * and its label go down together. Animating the border width instead reflowed
 * the label, which moved 3px against the face's 2px, a pixel at a time.
 * Only the bottom edge is clipped — the other three sides sit 100vmax out, so
 * whatever a button carries outside itself (the session Start's "Press Start"
 * bubble, a badge, a glow, the focus ring) stays visible while it is held.
 *
 * It snaps rather than tweens: a 2px move is too short to animate without the
 * text either stepping pixel by pixel or losing ClearType while the layer is
 * composited, and an instant press is what makes a key feel solid. The
 * standalone `translate` property composes with a caller's -translate-y-1/2
 * instead of replacing it.
 *
 * Each variant colours the lip itself — outline keeps its border colour. A
 * hand-built key on a near-black page uses PRESSABLE with a border-b-black/*
 * of its own, and a face light enough for the darker lip to stand out.
 */
const PRESSABLE =
  "font-semibold border-b-[3px] active:[translate:0_2px] active:[clip-path:inset(-100vmax_-100vmax_2px_-100vmax)]";

/**
 * The same key for a hand-built button that paints its own face, like the
 * session toolbars' chips, whose colour changes with their state. Put it first
 * in cn() so the caller's font weight wins, and leave transition-all out: it
 * would tween the press.
 *
 * Here the lip is a shadow, not a darker face: bg-clip-padding keeps the face
 * off the border, so the lip is black/30 over the page, whatever the face. A
 * zinc-800 chip on the toolbar's ~#1a1a1d sits too close to it for a darkened
 * face to show — black/30 of it landed on the page's own shade, and the lip
 * only appeared on hover, when the face got lighter.
 */
const PRESSABLE_KEY = `${PRESSABLE} bg-clip-padding border-b-black/30`;

/**
 * PRESSABLE for a key that only labels a bigger clickable — a whole card that
 * is the button. It sinks when the card is pressed anywhere, not just on the
 * key itself; the card needs `group`. The caller colours the lip, as with
 * PRESSABLE.
 */
const PRESSABLE_IN_GROUP =
  "font-semibold border-b-[3px] group-active:[translate:0_2px] group-active:[clip-path:inset(-100vmax_-100vmax_2px_-100vmax)]";

const buttonVariants = cva(
  "inline-flex font-openSans items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: [
          PRESSABLE,
          "border-b-black/25 bg-primary text-primary-foreground hover:bg-primary/90",
        ],
        destructive: [
          PRESSABLE,
          "border-b-black/25 bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ],
        // PRESSABLE goes last: `border` would otherwise drop the thicker
        // bottom. Hover stays below the border's shade, or the lip vanishes
        // into the face.
        outline: [
          "border border-input bg-transparent hover:bg-accent/60 hover:text-accent-foreground",
          PRESSABLE,
        ],
        secondary: [
          PRESSABLE,
          "border-b-black/25 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ],
        // The grey chip of dark chrome: session bars, the sidebar's icons. The
        // face is white/10, not the old chips' white/5: a darker lip under a
        // fainter face sank into the near-black page, and the key just read
        // 3px shorter. This shade keeps the lip between face and page on both
        // zinc-950 and the sidebar's card. Not PRESSABLE_KEY's shadow: on the
        // near-black session bars nothing reads darker than the page.
        subtle: [
          PRESSABLE,
          "border-b-black/30 bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white",
        ],
        // No lip on a button without a face — just the 1px press.
        ghost: "hover:bg-accent hover:text-accent-foreground active:[translate:0_1px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const content = (
      <span className="flex items-center justify-center">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </span>
    );

    // asChild renders the consumer's element (e.g. a Link) — Slot needs a single child.
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...({ disabled: disabled || loading, ...props } as any)}>
          {content}
        </Slot>
      );
    }

    return (
      <button
        className={cn("relative", buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}>
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, PRESSABLE, PRESSABLE_IN_GROUP, PRESSABLE_KEY };
