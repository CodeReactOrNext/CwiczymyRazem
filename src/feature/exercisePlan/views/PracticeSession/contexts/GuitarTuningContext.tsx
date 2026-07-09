import { createContext, useContext } from "react";

import type { GuitarTuningState } from "../hooks/useGuitarTuning";

const GuitarTuningContext = createContext<GuitarTuningState | undefined>(undefined);

export const GuitarTuningProvider = GuitarTuningContext.Provider;

export function useGuitarTuningContext() {
  const context = useContext(GuitarTuningContext);
  if (!context) throw new Error("useGuitarTuningContext must be used within a GuitarTuningProvider");
  return context;
}
