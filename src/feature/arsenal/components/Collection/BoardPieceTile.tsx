import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { BoardPiece } from "feature/arsenal/utils/boardPieces";

import { EffectStashTile } from "../GuitarInventory/EffectStashTile";
import { GuitarStashTile } from "../GuitarInventory/GuitarStashTile";
import { PartIcon } from "../Parts/PartIcon";
import { ModArt } from "../Workshop/ModArt";
import { SalvagedModCard } from "./SalvagedModCard";
import { ScrapPartCard } from "./ScrapPartCard";
import type { StashPlacement } from "./StashTile";
import { StashTile } from "./StashTile";

/** Mods are purple everywhere in the arsenal — the bench, the picker, the socket. */
export const MOD_TILE_COLOR = "#c084fc";

interface BoardPieceTileProps extends StashPlacement {
  piece: BoardPiece;
  /** Guitar sockets: sitting on the profile. */
  isEquipped?: boolean;
  /** Guitar sockets: rig slot index (0-2) this copy occupies, or null. */
  rigSlot?: number | null;
  /** Pedal sockets: wired into the pedalboard. */
  isOnPedalboard?: boolean;
  onClick?: () => void;
}

/**
 * One socket, whichever of the four kinds it holds.
 *
 * The arsenal's cabinet and the guild's shelf both draw their pieces through
 * here, so a Legendary pickup looks and behaves the same on either board — the
 * hover card included. What differs between the two boards is what a click
 * *does*, which is the caller's business, not the socket's.
 */
export const BoardPieceTile = ({
  piece,
  isEquipped = false,
  rigSlot = null,
  isOnPedalboard = false,
  onClick,
  ...placement
}: BoardPieceTileProps) => {
  if (piece.kind === "guitar")
    return (
      <GuitarStashTile
        {...placement}
        item={piece.item}
        isEquipped={isEquipped}
        rigSlot={rigSlot}
        onClick={onClick}
      />
    );

  if (piece.kind === "effect")
    return (
      <EffectStashTile
        {...placement}
        item={piece.item}
        isOnPedalboard={isOnPedalboard}
        onClick={onClick}
      />
    );

  if (piece.kind === "mod")
    return (
      <StashTile
        {...placement}
        color={MOD_TILE_COLOR}
        art={<ModArt modId={piece.mod.featureId} />}
        label={`${piece.name} +${piece.mod.points}`}
        level={piece.mod.points}
        levelPrefix='+'
        preview={<SalvagedModCard mod={piece.mod} />}
        onClick={onClick}
      />
    );

  return (
    <StashTile
      {...placement}
      color={PART_TIER_COLORS[piece.part.tier]}
      // Sized off the socket rather than in px: the board's cells grow with
      // the viewport, and a fixed box left a part swimming in a wide one.
      art={<PartIcon partId={piece.part.partId} className='p-[14%]' />}
      label={`${piece.name} ×${piece.part.qty}`}
      count={piece.part.qty}
      preview={
        <ScrapPartCard
          partId={piece.part.partId}
          tier={piece.part.tier}
          qty={piece.part.qty}
        />
      }
      onClick={onClick}
    />
  );
};
