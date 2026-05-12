import { useBpmProgress } from "feature/exercisePlan/hooks/useBpmProgress";
import { Exercise } from "feature/exercisePlan/types/exercise.types";
import React, { createContext, useContext, useMemo } from "react";

interface BpmProgressContextType {
  bpmStages: number[];
  completedBpms: number[];
  isBpmLoading: boolean;
  onBpmToggle: (bpm: number) => Promise<void>;
}

const BpmProgressContext = createContext<BpmProgressContextType | undefined>(undefined);

export const BpmProgressProvider: React.FC<{ exercise: Exercise; children: React.ReactNode }> = ({ exercise, children }) => {
  const { bpmStages, completedBpms, isLoading, handleToggleBpm } = useBpmProgress(exercise);

  const value = useMemo(() => ({
    bpmStages,
    completedBpms,
    isBpmLoading: isLoading,
    onBpmToggle: handleToggleBpm,
  }), [bpmStages, completedBpms, isLoading, handleToggleBpm]);

  return (
    <BpmProgressContext.Provider value={value}>
      {children}
    </BpmProgressContext.Provider>
  );
};

export const useBpmProgressContext = () => {
  const context = useContext(BpmProgressContext);
  if (!context) throw new Error("useBpmProgressContext must be used within a BpmProgressProvider");
  return context;
};
