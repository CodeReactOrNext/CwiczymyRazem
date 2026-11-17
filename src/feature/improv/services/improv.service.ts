import axios from "axios";
import type {
  ImprovOverview,
  ImprovTake,
  ImprovTakeResult,
} from "feature/improv/types/improv.types";
import { auth } from "utils/firebase/client/firebase.utils";

export const improvOverviewQueryKey = (uid: string | null) =>
  ["improv", "overview", uid] as const;

export const improvRoundTakesQueryKey = (roundId: string) =>
  ["improv", "round", roundId] as const;

const post = async <T>(
  url: string,
  body: Record<string, unknown> = {},
): Promise<T> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<T>(url, { idToken, ...body });
  return data;
};

export const fetchImprovOverview = () =>
  post<ImprovOverview>("/api/improv/overview");

export const fetchImprovRoundTakes = (roundId: string) =>
  post<ImprovTake[]>("/api/improv/round", { roundId });

export const submitImprovTake = (params: { url: string; note: string }) =>
  post<ImprovTakeResult>("/api/improv/submit-take", params);

export const removeImprovTake = (takeId: string) =>
  post<{ ok: true }>("/api/improv/remove-take", { takeId });

export const toggleImprovVote = (trackId: string) =>
  post<{ hasMyVote: boolean }>("/api/improv/vote", { trackId });

export const removeImprovTrack = (trackId: string) =>
  post<{ ok: true }>("/api/improv/remove-track", { trackId });

/** Adds a backing track to the pool. The link is all there is; the server reads the rest from YouTube. */
export const proposeImprovTrack = (youtubeUrl: string) =>
  post<{ trackId: string }>("/api/improv/propose-track", { youtubeUrl });

/** The API's error code ("LIMIT", "BAD_LINK"…), when there is one. */
export const improvErrorCode = (error: unknown): string | null =>
  axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
    ? error.response.data.error
    : null;
