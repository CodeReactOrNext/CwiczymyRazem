import React, { createContext, useCallback,useContext, useState } from "react";

interface SessionUIContextType {
  isLeaderboardOpen: boolean;
  openLeaderboard: () => void;
  closeLeaderboard: () => void;
  backingVideoId: string | null;
  setBackingVideoId: (id: string | null) => void;
  /** Browser only — the desktop app's native capture needs no calibration. */
  canCalibrateTiming: boolean;
  isTimingCalibrationOpen: boolean;
  openTimingCalibration: () => void;
  closeTimingCalibration: () => void;
}

const SessionUIContext = createContext<SessionUIContextType | undefined>(undefined);

export const SessionUIProvider: React.FC<{ children: React.ReactNode; canCalibrateTiming?: boolean }> = ({
  children,
  canCalibrateTiming = true,
}) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [backingVideoId, setBackingVideoId] = useState<string | null>(null);
  const [isTimingCalibrationOpen, setIsTimingCalibrationOpen] = useState(false);

  const openLeaderboard = useCallback(() => setIsLeaderboardOpen(true), []);
  const closeLeaderboard = useCallback(() => setIsLeaderboardOpen(false), []);
  const openTimingCalibration = useCallback(() => setIsTimingCalibrationOpen(true), []);
  const closeTimingCalibration = useCallback(() => setIsTimingCalibrationOpen(false), []);

  return (
    <SessionUIContext.Provider value={{
      isLeaderboardOpen, openLeaderboard, closeLeaderboard, backingVideoId, setBackingVideoId,
      canCalibrateTiming, isTimingCalibrationOpen, openTimingCalibration, closeTimingCalibration,
    }}>
      {children}
    </SessionUIContext.Provider>
  );
};

export const useSessionUI = () => {
  const context = useContext(SessionUIContext);
  if (!context) throw new Error("useSessionUI must be used within a SessionUIProvider");
  return context;
};
