import { create } from "zustand";

/** One live motivation the player received during the session on screen. */
export interface ReceivedLiveMotivation {
  id: string;
  senderName: string;
  senderAvatarUrl: string | null;
  fame: number;
  hype: boolean;
  hypeCount: number;
}

interface LiveMotivateState {
  /** Sessions this player already motivated, keyed `${uid}:${sessionKey}`. */
  sent: Record<string, true>;
  markSent: (key: string) => void;
  /** Takes back an optimistic mark when the server turned the motivation down. */
  unmarkSent: (key: string) => void;
  /** What the current session received, for its summary. */
  received: ReceivedLiveMotivation[];
  addReceived: (item: ReceivedLiveMotivation) => void;
  resetReceived: () => void;
}

export const liveSentKey = (uid: string, sessionKey: number) => `${uid}:${sessionKey}`;

export const useLiveMotivateStore = create<LiveMotivateState>()((set) => ({
  sent: {},
  markSent: (key) => set((state) => ({ sent: { ...state.sent, [key]: true } })),
  unmarkSent: (key) =>
    set((state) => {
      const { [key]: _removed, ...rest } = state.sent;
      return { sent: rest };
    }),
  received: [],
  addReceived: (item) =>
    set((state) =>
      state.received.some((r) => r.id === item.id) ? state : { received: [...state.received, item] },
    ),
  resetReceived: () => set({ received: [] }),
}));
