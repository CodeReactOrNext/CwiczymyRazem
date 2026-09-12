import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";

import type { CaseType, OpenCaseResult } from "../../types/arsenal.types";
import { CaseCard } from "./CaseCard";
import { DailyCaseCard } from "./DailyCaseCard";

interface CaseShopProps {
  currentFame: number;
  onOpenCase: (caseType: CaseType, useToken?: boolean) => void;
  isOpening: boolean;
  lastResult: OpenCaseResult | null;
  /** Free cases from achievement rewards — spendable on any card on the shelf. */
  freeTokens?: number;
}

/** Two rows of three, read as a ladder: the guitar cases climb Standard →
    Premium → Elite across the top, and the bottom row mirrors it with the
    two pedal cases sitting under their guitar siblings. */
const SHELF = [
  "standard",
  "premium-guitar",
  "elite-guitar",
  "supporter",
  "premium-effect",
  "elite-effect",
] as const;

export const CaseShop = ({
  currentFame,
  onOpenCase,
  isOpening,
  freeTokens = 0,
}: CaseShopProps) => {
  const openCard = (id: string, useToken?: boolean) =>
    onOpenCase(id as CaseType, useToken);

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
            Choose your case
          </h2>
          <p className='mt-1 text-sm text-zinc-500'>
            Find the next piece of your sound.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {SHELF.map((id) => (
            <CaseCard
              key={id}
              caseDef={CASE_DEFINITIONS[id]}
              currentFame={currentFame}
              onOpen={openCard}
              isOpening={isOpening}
              freeTokens={freeTokens}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
