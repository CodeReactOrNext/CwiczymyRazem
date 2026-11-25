import { cn } from "assets/lib/utils";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { CASE_PACK_SIZES } from "feature/arsenal/data/caseDefinitions";
import type { CaseDefinition } from "feature/arsenal/types/arsenal.types";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";

import { Segment, SegmentGroup } from "../SegmentedControl";
import { OpenCaseButton } from "./OpenCaseButton";

/** A free case, or how many to pay for. */
type Quantity = "free" | number;

interface CaseBuyControlProps {
  caseDef: CaseDefinition;
  currentFame: number;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides that choice. */
  freeTokens?: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  /** Opens a pack of this many. Omitted, only single opens are offered. */
  onOpenPack?: (caseType: string, count: number) => void;
  variant: "featured" | "soft";
  className?: string;
}

/**
 * Choose how many, then press one key.
 *
 * A card used to carry a key per way of paying — one, five, ten, a free case —
 * which put nineteen of them on the shelf. The choice is a switch now and the
 * price of it is on the only key.
 *
 * The switch starts on ×1: a free case is worth whatever it is spent on, so it
 * is the player who picks it, never the card.
 */
export const CaseBuyControl = ({
  caseDef,
  currentFame,
  isOpening,
  freeTokens = 0,
  onOpen,
  onOpenPack,
  variant,
  className,
}: CaseBuyControlProps) => {
  const { t } = useTranslation("arsenal");
  const [picked, setPicked] = useState<Quantity>(1);

  const options: Quantity[] = [
    ...(freeTokens > 0 && !caseDef.noFreeCase ? (["free"] as const) : []),
    1,
    ...(onOpenPack ? CASE_PACK_SIZES : []),
  ];
  // The last token spent, or a switch to a case no token opens, takes the
  // choice off the tray — back to a single paid open.
  const active = options.includes(picked) ? picked : 1;
  const isFree = active === "free";
  const count = isFree ? 1 : active;
  const cost = caseDef.fameCost * count;

  const handleOpen = () => {
    if (count > 1) onOpenPack?.(caseDef.id, count);
    else onOpen(caseDef.id, isFree || undefined);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {options.length > 1 && (
        <SegmentGroup
          aria-label={t("cases.how_many")}
          className='w-full bg-arsenal-bg'>
          {options.map((option) => (
            <Segment
              key={option}
              active={option === active}
              onClick={() => setPicked(option)}
              className='min-w-0 flex-1 justify-center px-1.5 tabular-nums'>
              {option === "free" ? (
                <>
                  <FreeCaseIcon size={18} />
                  <span className='sr-only'>{t("cases.open_free")}</span>
                  {freeTokens}
                </>
              ) : (
                `×${option}`
              )}
            </Segment>
          ))}
        </SegmentGroup>
      )}
      <OpenCaseButton
        canAfford={isFree || currentFame >= cost}
        isOpening={isOpening}
        onClick={handleOpen}
        payment={isFree ? { kind: "token" } : { kind: "fame", cost }}
        count={count}
        variant={variant}
      />
    </div>
  );
};
