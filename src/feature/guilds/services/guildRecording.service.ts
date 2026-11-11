import axios from "axios";
import type {
  RecordingView,
  TakeResult,
  TakeSubmission,
} from "feature/guilds/utils/guildRecording.utils";
import { auth } from "utils/firebase/client/firebase.utils";
import { create } from "zustand";

const post = async <T>(body: object = {}): Promise<T> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<T>("/api/supporter/guild/recording", {
    idToken: await user.getIdToken(),
    ...body,
  });
  return data;
};

export const fetchRecording = () => post<{ view: RecordingView }>();

/** Books a session on a tier; the server draws the client. */
export const bookRecording = (tier: number) =>
  post<{ view: RecordingView }>({ action: "book", tier });

export const deliverRecording = () =>
  post<{ view: RecordingView }>({ action: "deliver" });

export const claimRecordingPay = () =>
  post<{ view: RecordingView; fame: number }>({ action: "claim" });

/** What became of the take the player has just come back from. */
export interface LastTake extends TakeResult {
  partId: string;
  accuracy: number;
  bpm: number;
}

interface TakeStore {
  last: LastTake | null;
  setLast: (take: LastTake | null) => void;
  /**
   * Where a finished take goes instead of the server. Only the dev preview
   * sets it, to run a session on local state with no guild behind it.
   */
  sink: ((take: TakeSubmission) => TakeResult) | null;
  setSink: (sink: TakeStore["sink"]) => void;
}

/**
 * The last take's verdict, kept for the guild page to show once the player
 * is back on it: the take is sent from inside the practice session, which is
 * gone by the time there is anything to say about it.
 */
export const useRecordingTakeStore = create<TakeStore>((set) => ({
  last: null,
  setLast: (last) => set({ last }),
  sink: null,
  setSink: (sink) => set({ sink }),
}));

/** Sends a finished take to the guild's tape and remembers what came of it. */
export const submitRecordingTake = async (
  take: TakeSubmission,
): Promise<TakeResult> => {
  const { sink } = useRecordingTakeStore.getState();
  const result = sink
    ? sink(take)
    : (
        await post<{ view: RecordingView; take: TakeResult }>({
          action: "take",
          ...take,
        })
      ).take;
  useRecordingTakeStore.getState().setLast({
    ...result,
    partId: take.partId,
    accuracy: take.accuracy,
    bpm: take.bpm,
  });
  return result;
};
