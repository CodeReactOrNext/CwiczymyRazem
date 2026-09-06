import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { motifComponents } from "feature/guilds/components/motifIcons";
import type { MotifIconKey } from "feature/guilds/data/guildCosmetics";
import { DEFAULT_MOTIF_KEYS } from "feature/guilds/data/guildCosmetics";
import { bannerLook, lighten } from "feature/guilds/utils/guildCosmetics.style";

interface GuildBannerProps {
  /** Which banner, by id — anything unknown draws as the bare one. */
  bannerId: string;
  /** The accent it is drawn from. */
  hex: string;
  /** The four icons tiled across it. The starting set when not said. */
  icons?: readonly MotifIconKey[];
  /** Sets the height; the strip is always the full width of what holds it. */
  className?: string;
}

/**
 * The strip across the top of a guild card.
 *
 * A banner is a banner: it has its own place at the top of the card and stays
 * there, rather than running under the name, the buttons and the seat bar.
 * Drawn once here so the guild list, the kit and the page header all show the
 * same strip at the same pitch.
 *
 * Built the way every other surface in the app is: a background, and the tiled
 * icon pattern laid right across it — the pattern the sign-in screen, the hero
 * banners and the journey modules all wear, in the four icons the founder
 * picked. The icons go on every banner, the bare one included; what the
 * banner slot chooses is only the gradient under them. They are painted a pale
 * tint of the guild's colour and kept faint, so they read as a watermark and
 * not as a print.
 */
export const GuildBanner = ({
  bannerId,
  hex,
  icons = DEFAULT_MOTIF_KEYS,
  className,
}: GuildBannerProps) => {
  const look = bannerLook(bannerId, hex);

  return (
    <div
      aria-hidden
      style={look.base}
      className={cn("relative h-20 w-full overflow-hidden", className)}>
      {look.layers.map((layer, index) => (
        <div key={index} className='absolute inset-0' style={layer} />
      ))}
      <GuitarPatternBackground
        opacity={0.09}
        scale={0.8}
        color={lighten(hex, 0.55)}
        icons={motifComponents(icons)}
      />
    </div>
  );
};
