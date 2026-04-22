import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import type { CaseType, OpenCaseResult } from "../../types/arsenal.types";
import { CaseCard } from "./CaseCard";

interface CaseShopProps {
  currentFame: number;
  onOpenCase: (caseType: CaseType) => void;
  isOpening: boolean;
  lastResult: OpenCaseResult | null;
}

export const CaseShop = ({ currentFame, onOpenCase, isOpening }: CaseShopProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {Object.values(CASE_DEFINITIONS).map((caseDef) => (
        <CaseCard
          key={caseDef.id}
          caseDef={caseDef}
          currentFame={currentFame}
          onOpen={(id) => onOpenCase(id as CaseType)}
          isOpening={isOpening}
        />
      ))}
    </div>
  );
};
