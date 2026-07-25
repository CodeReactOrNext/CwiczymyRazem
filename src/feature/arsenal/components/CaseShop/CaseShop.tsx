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

export const CaseShop = ({ currentFame, onOpenCase, isOpening }: CaseShopProps) => {
  const openCard = (id: string) => onOpenCase(id as CaseType);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DailyCaseCard currentFame={currentFame} onOpen={openCard} isOpening={isOpening} />

      {/* Standard rolls from both pools, full height on the left — Premium/Elite
          on the right split guitars vs effects into an equal-size 2x2 grid. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <CaseCard
          caseDef={CASE_DEFINITIONS.standard}
          currentFame={currentFame}
          onOpen={openCard}
          isOpening={isOpening}
          className="lg:w-2/5"
        />
        <div className="grid flex-1 grid-cols-1 gap-6 xsm:grid-cols-2">
          <CaseCard
            caseDef={CASE_DEFINITIONS["premium-guitar"]}
            currentFame={currentFame}
            onOpen={openCard}
            isOpening={isOpening}
            size="compact"
          />
          <CaseCard
            caseDef={CASE_DEFINITIONS["elite-guitar"]}
            currentFame={currentFame}
            onOpen={openCard}
            isOpening={isOpening}
            size="compact"
          />
          <CaseCard
            caseDef={CASE_DEFINITIONS["premium-effect"]}
            currentFame={currentFame}
            onOpen={openCard}
            isOpening={isOpening}
            size="compact"
          />
          <CaseCard
            caseDef={CASE_DEFINITIONS["elite-effect"]}
            currentFame={currentFame}
            onOpen={openCard}
            isOpening={isOpening}
            size="compact"
          />
        </div>
      </div>
    </div>
  );
};
