import { cn } from "assets/lib/utils";
import { BannerParticles } from "feature/cosmetics/components/BannerParticles";
import styles from "feature/cosmetics/components/cosmetics.module.css";
import { DrawnBanner } from "feature/cosmetics/components/DrawnBanner";
import { cosmeticImage } from "feature/cosmetics/data/cosmeticsCatalog";
import type { BannerCosmetic } from "feature/cosmetics/types/cosmetics.types";

/** Whether the card under this banner has to stay dark in the light theme. */
export const bannerNeedsDarkCard = (
  item: BannerCosmetic | undefined,
): boolean => !!item && !item.drawn;

interface CosmeticBannerProps {
  item: BannerCosmetic;
  className?: string;
}

/**
 * The backdrop of an activity card. Fills its nearest positioned ancestor,
 * which must clip (`overflow-hidden`). A painting also needs that card dark
 * (`force-dark`, see `bannerNeedsDarkCard`): the pictures are night scenes.
 */
export const CosmeticBanner = ({ item, className }: CosmeticBannerProps) => {
  if (item.drawn) {
    return (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          styles.phoneBand,
          className,
        )}>
        <DrawnBanner look={item.drawn} />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        styles.paintedFrame,
        className,
      )}>
      {/* Sized by the row's height, not its width: a short row gets the whole
          picture, smaller and pushed into the right-hand corner, instead of a
          thin slice cut out of the middle of a full-width one. The sizes, the
          fades and the phone layout live in `.paintedArt`. */}
      <div
        className={cn(
          "absolute right-0 top-0 aspect-[4/1] max-w-none overflow-hidden",
          styles.paintedArt,
        )}>
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-right-top",
            styles.bannerArt,
          )}
          style={{ backgroundImage: `url(${cosmeticImage(item)})` }}
        />
      </div>
      <div className={cn("absolute inset-0", styles.paintedShade)} />
      {item.flash && <div className={cn("absolute inset-0", styles.flash)} />}
      {item.particles && (
        <div className={cn("absolute inset-0", styles.phoneBand)}>
          <BannerParticles kind={item.particles} />
        </div>
      )}
    </div>
  );
};
