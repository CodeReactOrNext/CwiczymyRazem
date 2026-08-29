import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";

import type { CaseType, OpenCaseResult } from "../../types/arsenal.types";
import { CaseCard } from "./CaseCard";
import { DailyCaseCard } from "./DailyCaseCard";

interface CaseShopProps {
  currentFame: number;
  onOpenCase: (caseType: CaseType) => void;
  isOpening: boolean;
  lastResult: OpenCaseResult | null;
}

/** Ordered as the price ladder reads: Premium pair first, then the Elite pair,
    so cost climbs left to right and the pairs stack by tier when it wraps. */
const POOL_CASES = [
  "premium-guitar",
  "premium-effect",
  "elite-guitar",
  "elite-effect",
] as const;

/** The two that stand alone: everything else on the shelf comes as a
    guitar/effect pair, and these two draw from a pool of their own. */
const SOLO_CASES = ["standard", "supporter"] as const;

export const CaseShop = ({
  currentFame,
  onOpenCase,
  isOpening,
}: CaseShopProps) => {
  const openCard = (id: string) => onOpenCase(id as CaseType);

  return (
    <div className='flex w-full flex-col gap-8'>
      <DailyCaseCard
        currentFame={currentFame}
        onOpen={openCard}
        isOpening={isOpening}
      />

      {/* The permanent shelf. Standard and Supporter take the top row two-up —
          wider tiles than the row below, which keeps the pair from reading as
          the first two of a six-case grid — with the four pool cases under it. */}
      <div className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {SOLO_CASES.map((id) => (
            <CaseCard
              key={id}
              caseDef={CASE_DEFINITIONS[id]}
              currentFame={currentFame}
              onOpen={openCard}
              isOpening={isOpening}
            />
          ))}
        </div>
        <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 lg:grid-cols-4'>
          {POOL_CASES.map((id) => (
            <CaseCard
              key={id}
              caseDef={CASE_DEFINITIONS[id]}
              currentFame={currentFame}
              onOpen={openCard}
              isOpening={isOpening}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
