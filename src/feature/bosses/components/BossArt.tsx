import type { BossDefinition } from "../types/boss.types";
import type { BossForm } from "../utils/bossArt";
import { ColossusArt } from "./ColossusArt";
import { FretweaverArt } from "./FretweaverArt";

interface BossArtProps {
  boss: BossDefinition;
  form?: BossForm;
  mood?: "idle" | "defeated" | "victorious";
  strikeTick?: number;
  biteTick?: number;
  slamTick?: number;
  /** A slam — or a quake — is coming. */
  windup?: boolean;
  /** The colossus's quake is under way. */
  quaking?: boolean;
  /** A weak spot is open (the spider) or the weak change is next (the colossus). */
  exposed?: boolean;
  molting?: boolean;
  intro?: boolean;
  /** The finger order the spider's legs tap. */
  pattern?: readonly number[];
  /** The spider's web behind it, torn by this share (0–1); no web when absent. */
  webTorn?: number;
  /** Legs off the spider, plates off the colossus. */
  piecesLost?: number;
  className?: string;
}

/** The boss's drawing, whichever boss it is. */
export const BossArt = ({
  boss,
  form = 0,
  pattern,
  webTorn,
  piecesLost = 0,
  quaking,
  ...shared
}: BossArtProps) =>
  boss.id === "colossus" ? (
    <ColossusArt {...shared} form={form} quaking={quaking} platesLost={piecesLost} />
  ) : (
    <FretweaverArt {...shared} phase={form} pattern={pattern} webTorn={webTorn} legsLost={piecesLost} />
  );
