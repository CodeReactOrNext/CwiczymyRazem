import { cn } from "assets/lib/utils";
import styles from "feature/cosmetics/components/cosmetics.module.css";
import type { BannerLights as BannerLightsKind } from "feature/cosmetics/types/cosmetics.types";
import type { CSSProperties } from "react";

/**
 * Where the eight guitars of the Lineage banner stand, as a share of the
 * picture's width, oldest first, with the colour of the lamp above each: the
 * row warms up in amber and ends in a cold blue.
 */
const LAMPS: { x: number; color: string }[] = [
  { x: 31.5, color: "253 186 116" },
  { x: 40.4, color: "253 186 116" },
  { x: 49.5, color: "254 215 170" },
  { x: 57.8, color: "254 235 200" },
  { x: 65.9, color: "241 245 249" },
  { x: 73.4, color: "191 219 254" },
  { x: 81.3, color: "147 197 253" },
  { x: 89.3, color: "125 211 252" },
];

interface BannerLightsProps {
  kind: BannerLightsKind;
}

/**
 * The light that moves in one particular painting. Each piece is placed by
 * hand on that picture, and lives inside the art box so it rides the banner's
 * push-in with it.
 *
 * - `spotlights` — Lineage: the lamps come up one after another, old guitar
 *   to new, then a long dark pause.
 * - `moon` — Crossroads: the moon breathes and fog drifts along the road.
 * - `sun` — Anubis: the sun disc breathes and a spark flickers at the headstock.
 */
export const BannerLights = ({ kind }: BannerLightsProps) => {
  if (kind === "moon") {
    return (
      <>
        <span className={cn("absolute", styles.moonGlow)} />
        <span className={cn("absolute", styles.fog)} />
      </>
    );
  }

  if (kind === "sun") {
    return (
      <>
        <span className={cn("absolute", styles.sunGlow)} />
        <span className={cn("absolute", styles.spark)} />
      </>
    );
  }

  return (
    <>
      {LAMPS.map((lamp, index) => (
        <span
          key={lamp.x}
          className={cn("absolute inset-y-0", styles.spotlight)}
          style={
            {
              left: `${lamp.x}%`,
              "--lamp": lamp.color,
              "--lamp-index": index,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
};
