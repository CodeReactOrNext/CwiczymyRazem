import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import type { ReactNode } from "react";
import { useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { CardModal } from "./CardModal";

interface EquippedGuitarTooltipProps {
  /** Owner of the guitar — whose arsenal the card is read from. */
  userId: string;
  /** Whatever the guitar is drawn on: an avatar's badge, a row's thumbnail. */
  children: ReactNode;
}

/** Same width the rest of the hover cards are shown at. */
const CARD_WIDTH = 250;

/**
 * Hangs the arsenal's own card off an equipped guitar wherever it is shown, so
 * a profile says exactly what the bench and the rig say — promoted rarity,
 * level, condition, traits and all. The card reads the owner's inventory item;
 * the catalogue entry behind the picture only knows what the guitar was at mint.
 *
 * The read waits for the first open: a leaderboard draws a dozen of these and
 * most of them are never looked at.
 */
export const EquippedGuitarTooltip = ({
  userId,
  children,
}: EquippedGuitarTooltipProps) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [opened, setOpened] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { item } = useEquippedGuitar(userId, opened);

  // Touch devices: tap opens the card in a modal (hover tooltips don't fire),
  // and the guitar often hangs inside a link to the profile.
  if (isMobile) {
    return (
      <>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpened(true);
            setModalOpen(true);
          }}>
          {children}
        </span>
        {modalOpen && item && (
          <CardModal onClose={() => setModalOpen(false)}>
            <GuitarCard item={item} readOnly />
          </CardModal>
        )}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip
        delayDuration={150}
        onOpenChange={(open) => open && setOpened(true)}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {item && (
          <TooltipContent
            className='border-0 bg-transparent p-0 shadow-2xl'
            side='top'>
            <div style={{ width: CARD_WIDTH }}>
              <GuitarCard item={item} readOnly />
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
