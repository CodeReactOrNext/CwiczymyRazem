/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";
import styles from "feature/cosmetics/components/cosmetics.module.css";
import { cosmeticImage } from "feature/cosmetics/data/cosmeticsCatalog";
import type { AvatarCosmetic } from "feature/cosmetics/types/cosmetics.types";
import type { CSSProperties, ReactNode } from "react";

/** Rings sit a hair outside the avatar's edge; the pieces that overlap it sit exactly on it. */
const RING_CLEARANCE = 1.04;

interface AvatarDecorationProps {
  item: AvatarCosmetic | undefined;
  children: ReactNode;
  className?: string;
}

/**
 * Draws a bought decoration round a circular avatar.
 *
 * The art is sized from the avatar itself (the wrapper hugs it), so the same
 * component fits the 32px avatar of a phone row and the 96px one of a preview.
 * It overflows the avatar on purpose — callers leave a little room around it.
 */
export const AvatarDecoration = ({ item, children, className }: AvatarDecorationProps) => {
  if (!item) return <>{children}</>;

  const scale = (item.inner >= 0.6 ? RING_CLEARANCE : 1) / item.inner;
  const size = `${scale * 100}%`;

  return (
    <div className={cn("relative inline-flex aspect-square shrink-0", className)}>
      <div className='relative flex'>{children}</div>
      <img
        aria-hidden
        alt=''
        src={cosmeticImage(item)}
        loading='lazy'
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-20 max-w-none",
          styles[item.motion],
        )}
        style={
          {
            width: size,
            height: size,
            marginLeft: `-${(scale * 100) / 2}%`,
            marginTop: `-${(scale * 100) / 2}%`,
            "--cosmetic-duration": `${item.duration}s`,
          } as CSSProperties
        }
      />
    </div>
  );
};
