import { Button } from "assets/components/ui/button";
import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import {
  renderEffectIcon,
  renderKindIcon,
} from "feature/gearProposals/constants/gearIcons";
import { GEAR_BOARD_HREF } from "feature/gearProposals/constants/gearProposal.constants";
import type { GearDraft } from "feature/gearProposals/types/gearProposal.types";
import { safeImageUrl } from "feature/gearProposals/utils/gearProposal.utils";
import { GEAR_PROPOSAL_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import { ImageOff } from "lucide-react";
import Link from "next/link";

interface GearProposalSummaryProps {
  draft: GearDraft;
  tokensLeft: number;
  busy: boolean;
  onSubmit: () => void;
}

/**
 * The draft as the thing it would become, and the price of filing it.
 *
 * A dialog had nowhere to put this — every pixel it took was a pixel off the
 * form. A page has a second column going spare, so the item gets drawn in the
 * same plate the board and the stash draw it in, lit by the rarity being asked
 * for, while it is still being written.
 */
export const GearProposalSummary = ({
  draft,
  tokensLeft,
  busy,
  onSubmit,
}: GearProposalSummaryProps) => {
  const styles = RARITY_STYLES[draft.rarity];
  const preview = safeImageUrl(draft.imageUrl);
  const named = draft.name.trim().length > 0;
  const affordable = tokensLeft >= GEAR_PROPOSAL_COST;

  return (
    <aside className='space-y-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6 lg:sticky lg:top-6'>
      <div className='flex items-start gap-4'>
        <TierPlate color={styles.baseColor} size={92} className='shrink-0'>
          {preview ? (
            <img
              src={preview}
              alt=''
              // Somebody else's host; no need to tell them where it is viewed.
              referrerPolicy='no-referrer'
              className='h-[76px] w-[76px] object-contain'
            />
          ) : (
            <span style={{ color: `${styles.baseColor}66` }}>
              {draft.imageUrl.trim() ? (
                <ImageOff size={20} />
              ) : (
                renderKindIcon(draft.kind, 24)
              )}
            </span>
          )}
        </TierPlate>

        <div className='min-w-0 flex-1 space-y-1'>
          <p
            className={cn(
              "break-words text-lg font-bold leading-tight",
              named ? styles.text : "text-zinc-600",
            )}>
            {named ? draft.name.trim() : "Still unnamed"}
          </p>
          {draft.brand.trim() && (
            <p className='truncate text-sm text-zinc-500'>
              {draft.brand.trim()}
            </p>
          )}
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Chip color='custom' style={getChipCustomStyle(styles.baseColor)}>
          {draft.rarity}
        </Chip>
        <Chip color='gray'>
          {renderKindIcon(draft.kind, 13)}
          {draft.kind === "guitar" ? "Guitar" : "Pedal"}
        </Chip>
        {draft.kind === "effect" && (
          <Chip color='cyan'>
            {renderEffectIcon(draft.effectType, 13)}
            {draft.effectType}
          </Chip>
        )}
      </div>

      {draft.inscription.trim() && (
        <p className='break-words text-sm italic text-amber-300/90'>
          “{draft.inscription.trim()}”
        </p>
      )}

      <div className='space-y-2.5'>
        <p className='text-xs font-bold text-zinc-500'>Breaks down into</p>
        {draft.scrapBom.length === 0 ? (
          <p className='text-sm text-zinc-500'>
            Nothing picked — the bench decides.
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {draft.scrapBom.map((slot) => (
              <TierPlate
                key={slot.partId}
                color={PART_TIER_COLORS[slot.tier]}
                size={38}
                count={slot.qty > 1 ? slot.qty : undefined}>
                <PartIcon partId={slot.partId} size={22} />
              </TierPlate>
            ))}
          </div>
        )}
        {draft.scrapBom.length > 0 && (
          <p className='text-xs text-zinc-500'>
            {draft.scrapBom
              .map((slot) => getPartLabel(slot.partId))
              .join(" → ")}
          </p>
        )}
      </div>

      <div className='space-y-3 pt-1'>
        <Button
          onClick={onSubmit}
          loading={busy}
          disabled={!named || !affordable || busy}
          className='w-full'>
          {affordable ? (
            <span className='flex items-center gap-1.5'>
              Propose for
              <SupportToken size={20} />
              {GEAR_PROPOSAL_COST}
            </span>
          ) : (
            "Not enough tokens"
          )}
        </Button>

        <p className='text-center text-xs text-zinc-500'>
          {!affordable
            ? `${GEAR_PROPOSAL_COST - tokensLeft} more tokens and this is yours to file.`
            : !named
              ? "Give it a name and it can go on the board."
              : `You have ${tokensLeft} tokens left.`}
        </p>

        <Button asChild variant='ghost' className='w-full text-zinc-400'>
          <Link href={GEAR_BOARD_HREF}>Back to the board</Link>
        </Button>
      </div>
    </aside>
  );
};
