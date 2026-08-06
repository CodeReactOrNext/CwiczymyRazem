import { cn } from "assets/lib/utils";
import { PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import type { PartId } from "feature/arsenal/types/arsenal.types";
import { Bolt } from "lucide-react";

interface PartIconProps {
  partId: PartId;
  /** Rendered box in px — the source art is 128px, so anything up to 64 stays crisp. */
  size?: number;
  className?: string;
}

/**
 * A part's artwork, or a neutral glyph for the parts that have none yet. Always
 * occupies the same box either way so rows and tiles never reflow.
 */
export const PartIcon = ({ partId, size = 20, className }: PartIconProps) => {
  const def = PARTS_BY_ID.get(partId);
  const box = { width: size, height: size };

  if (!def?.icon) {
    return (
      <span
        className={cn("flex shrink-0 items-center justify-center", className)}
        style={box}
        aria-hidden>
        <Bolt size={Math.round(size * 0.62)} className="text-zinc-600" />
      </span>
    );
  }

  return (
    <img
      src={def.icon}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn("shrink-0 object-contain", className)}
      style={box}
    />
  );
};
