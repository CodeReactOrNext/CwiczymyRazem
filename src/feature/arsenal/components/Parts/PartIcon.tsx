import { cn } from "assets/lib/utils";
import { PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import type { PartId } from "feature/arsenal/types/arsenal.types";
import { Bolt } from "lucide-react";

interface PartIconProps {
  partId: PartId;
  /**
   * Rendered box in px — the source art is 128px, so anything up to 64 stays
   * crisp. Omit it to fill the parent instead, e.g. a stash socket, which sizes
   * itself off the board rather than off a number known here.
   */
  size?: number;
  className?: string;
}

/**
 * A part's artwork, or a neutral glyph for the parts that have none yet. Always
 * occupies the same box either way so rows and tiles never reflow.
 */
export const PartIcon = ({ partId, size, className }: PartIconProps) => {
  const def = PARTS_BY_ID.get(partId);
  const box = size == null ? undefined : { width: size, height: size };

  if (!def?.icon) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          size == null && "h-full w-full",
          className,
        )}
        style={box}
        aria-hidden>
        <Bolt
          size={size == null ? undefined : Math.round(size * 0.62)}
          className={cn("text-zinc-600", size == null && "h-[62%] w-[62%]")}
        />
      </span>
    );
  }

  return (
    <img
      src={def.icon}
      alt=''
      aria-hidden
      width={size}
      height={size}
      loading='lazy'
      decoding='async'
      // Never a native drag source: sockets in the stash are dragged themselves.
      draggable={false}
      className={cn(
        "shrink-0 object-contain",
        size == null && "h-full w-full",
        className,
      )}
      style={box}
    />
  );
};
