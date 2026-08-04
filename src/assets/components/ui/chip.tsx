import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const chipVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 whitespace-normal break-words rounded-lg px-3 py-1.5 align-middle text-xs font-semibold transition-colors",
  {
    variants: {
      color: {
        cyan: "bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/50",
        emerald: "bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50",
        purple: "bg-purple-950/30 text-purple-400 hover:bg-purple-950/50",
        amber: "bg-amber-950/30 text-amber-400 hover:bg-amber-950/50",
        yellow: "bg-yellow-950/30 text-yellow-400 hover:bg-yellow-950/50",
        blue: "bg-blue-950/30 text-blue-400 hover:bg-blue-950/50",
        gray: "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/60",
        // Background/text come from an inline `style` (dynamic hex, e.g. rarity/tier colors) — see `getChipCustomStyle`.
        custom: "",
      },
    },
    defaultVariants: { color: "gray" },
  }
);

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof chipVariants> {}

/** Pill badge (icon + label): tinted translucent fill + bright colored text, same hue, no border. */
const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, color, ...props }, ref) => (
    <span ref={ref} className={cn(chipVariants({ color, className }))} {...props} />
  )
);
Chip.displayName = "Chip";

/** Translucent tinted fill + full-strength hex text, for `color="custom"` chips driven by a
 * runtime hex (rarity/tier colors) instead of a fixed Tailwind color name. */
export const getChipCustomStyle = (hex: string): React.CSSProperties => ({
  backgroundColor: `${hex}1a`,
  color: hex,
});

export { Chip, chipVariants };
