import React, { createContext, useContext, useState, useCallback } from "react";

interface SessionUIContextType {
  isLeaderboardOpen: boolean;
  openLeaderboard: () => void;
  closeLeaderboard: () => void;
}

const SessionUIContext = createContext<SessionUIContextType | undefined>(undefined);

export const SessionUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const openLeaderboard = useCallback(() => setIsLeaderboardOpen(true), []);
  const closeLeaderboard = useCallback(() => setIsLeaderboardOpen(false), []);

  return (
    <SessionUIContext.Provider value={{ isLeaderboardOpen, openLeaderboard, closeLeaderboard }}>
      {children}
    </SessionUIContext.Provider>
  );
};

export const useSessionUI = () => {
  const context = useContext(SessionUIContext);
  if (!context) throw new Error("useSessionUI must be used within a SessionUIProvider");
  return context;
};
