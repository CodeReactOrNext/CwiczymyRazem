import type { BossDefinition } from "../types/boss.types";
import type { BossForm } from "../utils/bossArt";
import type { ChangelingExpression } from "./ChangelingArt";
import { ChangelingArt } from "./ChangelingArt";
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
  /** The colossus's quake (the changeling's rush) is under way. */
  quaking?: boolean;
  /** A weak spot is open (the spider) or the weak change is next (the colossus). */
  exposed?: boolean;
  molting?: boolean;
  intro?: boolean;
  /** The finger order the spider's legs tap. */
  pattern?: readonly number[];
  /** The spider's web behind it, torn by this share (0–1); no web when absent. */
  webTorn?: number;
  /** Legs off the spider, plates off the colossus, tatters off the changeling. */
  piecesLost?: number;
  /** The changeling: the face of the chord it is, a turn of the mask on every change, an orb per tone. */
  expression?: ChangelingExpression;
  changeTick?: number;
  tones?: number;
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
  expression,
  changeTick,
  tones,
  ...shared
}: BossArtProps) =>
  boss.id === "colossus" ? (
    <ColossusArt {...shared} form={form} quaking={quaking} platesLost={piecesLost} />
  ) : boss.id === "changeling" ? (
    <ChangelingArt
      {...shared}
      form={form}
      quaking={quaking}
      tattersLost={piecesLost}
      expression={expression}
      changeTick={changeTick}
      tones={tones}
    />
  ) : (
    <FretweaverArt {...shared} phase={form} pattern={pattern} webTorn={webTorn} legsLost={piecesLost} />
  );
