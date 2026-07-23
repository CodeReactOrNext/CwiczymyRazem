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
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DailyCaseCard
        currentFame={currentFame}
        onOpen={(id) => onOpenCase(id as CaseType)}
        isOpening={isOpening}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Object.values(CASE_DEFINITIONS)
          .filter((caseDef) => caseDef.id !== "daily")
          .map((caseDef) => (
            <CaseCard
              key={caseDef.id}
              caseDef={caseDef}
              currentFame={currentFame}
              onOpen={(id) => onOpenCase(id as CaseType)}
              isOpening={isOpening}
            />
          ))}
      </div>
    </div>
  );
};
