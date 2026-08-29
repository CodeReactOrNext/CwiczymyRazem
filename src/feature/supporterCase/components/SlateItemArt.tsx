import {
  PLATE_NOISE_BG,
  plateStyle,
  TierPlate,
} from "feature/arsenal/components/TierPlate";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import type { SlateItem } from "feature/supporterCase/types/supporterCase.types";
import { Guitar, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";

/**
 * An item's own artwork, in the plate everything in the Arsenal sits in.
 *
 * Guitars and pedals keep their art in different places and under different
 * naming rules, so the two helpers that already own those paths are used rather
 * than rebuilding the URL here — a third copy would be the one that goes stale
 * the next time the art pipeline changes.
 *
 * Not every id necessarily has a file on disk, so a failed load falls back to
 * the silhouette instead of leaving a broken-image glyph in the middle of a
 * plate.
 *
 * `width` widens the plate past a square. Guitar art is roughly 2.4:1, so a
 * square plate spends its height on empty space and draws the guitar itself at
 * a fraction of the plate — which is how a 34px plate ended up showing a 26px
 * guitar nobody could make out. A wide plate is the one that fits both shapes:
 * the guitar spans it, and a pedal still fills it top to bottom.
 */
export const SlateItemArt = ({
  item,
  color,
  size = 44,
  width,
}: {
  item: SlateItem;
  color: string;
  /** Height of the plate, and the side of it when no width is given. */
  size?: number;
  /** Plate width — a number of px, or "full" to take the row it is in. */
  width?: number | "full";
}) => {
  const [failed, setFailed] = useState(false);

  // The variants are cheap and the small one tops out around 200px, which a
  // large plate on a retina screen outruns.
  const variant = size >= 60 ? "medium" : "small";
  const src =
    item.kind === "guitar"
      ? getRankBadgeSrc(item.imageId, variant)
      : getEffectImageSrc(item.imageId, variant);

  /** The art, or the silhouette once the file has proved not to be there. */
  const art = (style: CSSProperties, className: string) =>
    failed ? (
      <span style={{ color }}>
        {item.kind === "guitar" ? (
          <Guitar size={Math.round(size * 0.45)} />
        ) : (
          <Zap size={Math.round(size * 0.45)} />
        )}
      </span>
    ) : (
      <img
        src={src}
        alt=''
        aria-hidden
        loading='lazy'
        onError={() => setFailed(true)}
        style={style}
        className={className}
      />
    );

  if (width === undefined) {
    return (
      <TierPlate color={color} size={size}>
        {art(
          { maxWidth: size * 0.82, maxHeight: size * 0.82 },
          "object-contain",
        )}
      </TierPlate>
    );
  }

  return (
    <span
      aria-hidden
      className={
        width === "full"
          ? "relative flex w-full items-center justify-center overflow-hidden rounded-md"
          : "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md"
      }
      style={{
        height: size,
        ...(typeof width === "number" ? { width } : {}),
        ...plateStyle({ color, size }),
      }}>
      <span
        className='pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay'
        style={{
          backgroundImage: PLATE_NOISE_BG,
          backgroundSize: "140px 140px",
        }}
      />
      {art({ maxHeight: size * 0.84 }, "relative max-w-[88%] object-contain")}
    </span>
  );
};
