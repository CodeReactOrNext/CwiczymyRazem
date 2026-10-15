import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { canDiscoverNew } from "feature/arsenal/utils/caseRoll";
import { readPity } from "feature/arsenal/utils/pity";
import { useTranslation } from "hooks/useTranslation";
import { useMemo, useState } from "react";

import type {
  CasePityState,
  CaseType,
  OpenCaseResult,
} from "../../types/arsenal.types";
import { Segment, SegmentGroup } from "../SegmentedControl";
import { CaseCard } from "./CaseCard";
import { DailyCaseCard } from "./DailyCaseCard";

interface CaseShopProps {
  currentFame: number;
  onOpenCase: (caseType: CaseType, useToken?: boolean) => void;
  /** Opens a pack of the same case. Omitted, the shelf has no pack buttons. */
  onOpenPack?: (caseType: CaseType, count: number) => void;
  isOpening: boolean;
  lastResult: OpenCaseResult | null;
  /** Free cases from achievement rewards — spendable on any card on the shelf. */
  freeTokens?: number;
  /** The player's pity counters, as the inventory route returns them. */
  casePity?: CasePityState;
  /** What the Dex already holds, so a counter is only printed where it can pay out. */
  dexGuitarIds?: readonly (number | string)[];
  dexEffectIds?: readonly (number | string)[];
}

/**
 * The shelf, read as a ladder: Standard → Premium → Elite → Vault across the top,
 * with the two cases that are not rungs of it — the supporters' slate and the
 * Parts Crate — underneath.
 *
 * Premium, Elite and Vault each come in a guitar and a pedal version. They share
 * one card with a switch instead of taking two, so the shelf keeps one card per
 * rung however many pools a rung draws from.
 */
const LADDER: CaseType[][] = [
  ["standard"],
  ["premium-guitar", "premium-effect"],
  ["elite-guitar", "elite-effect"],
  ["vault-guitar", "vault-effect"],
];

const SIDE: CaseType[][] = [["supporter"], ["parts"]];

interface GroupProps {
  ids: CaseType[];
  currentFame: number;
  isOpening: boolean;
  freeTokens: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  onOpenPack?: (caseType: string, count: number) => void;
  casePity?: CasePityState;
  guitarSeen: ReadonlySet<number | string>;
  effectSeen: ReadonlySet<number | string>;
}

/** One card of the shelf, with a guitar/pedal switch when its rung has both. */
const CaseGroupCard = ({
  ids,
  casePity,
  guitarSeen,
  effectSeen,
  ...rest
}: GroupProps) => {
  const labels = useArsenalLabels();
  const [activeId, setActiveId] = useState<CaseType>(ids[0]);
  const caseDef = CASE_DEFINITIONS[activeId];

  const toggle =
    ids.length > 1 ? (
      <SegmentGroup>
        {ids.map((id) => (
          <Segment
            key={id}
            active={id === activeId}
            onClick={() => setActiveId(id)}>
            {labels.kind(
              CASE_DEFINITIONS[id].dropKind === "effect" ? "effect" : "guitar",
            )}
          </Segment>
        ))}
      </SegmentGroup>
    ) : undefined;

  return (
    <CaseCard
      caseDef={caseDef}
      pity={readPity(casePity, caseDef)}
      canDiscoverNew={canDiscoverNew(caseDef, guitarSeen, effectSeen)}
      toggle={toggle}
      {...rest}
    />
  );
};

export const CaseShop = ({
  currentFame,
  onOpenCase,
  onOpenPack,
  isOpening,
  freeTokens = 0,
  casePity,
  dexGuitarIds = [],
  dexEffectIds = [],
}: CaseShopProps) => {
  const { t } = useTranslation("arsenal");
  const openCard = (id: string, useToken?: boolean) =>
    onOpenCase(id as CaseType, useToken);
  const openPack = onOpenPack
    ? (id: string, count: number) => onOpenPack(id as CaseType, count)
    : undefined;

  const guitarSeen = useMemo(() => new Set(dexGuitarIds), [dexGuitarIds]);
  const effectSeen = useMemo(() => new Set(dexEffectIds), [dexEffectIds]);

  const renderGroup = (ids: CaseType[]) => (
    <CaseGroupCard
      key={ids[0]}
      ids={ids}
      currentFame={currentFame}
      isOpening={isOpening}
      freeTokens={freeTokens}
      onOpen={openCard}
      onOpenPack={openPack}
      casePity={casePity}
      guitarSeen={guitarSeen}
      effectSeen={effectSeen}
    />
  );

  return (
    <div className='flex w-full flex-col gap-10'>
      <DailyCaseCard
        currentFame={currentFame}
        onOpen={openCard}
        isOpening={isOpening}
        freeTokens={freeTokens}
      />

      <section className='flex flex-col gap-5'>
        <div>
          <h2 className='font-display text-2xl font-black text-zinc-100'>
            {t("cases.shelf_title")}
          </h2>
          <p className='mt-1 text-sm text-zinc-500'>
            {t("cases.shelf_subtitle")}
          </p>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {LADDER.map(renderGroup)}
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {SIDE.map(renderGroup)}
        </div>
      </section>
    </div>
  );
};
