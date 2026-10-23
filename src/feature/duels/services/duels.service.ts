import axios from "axios";
import type {
  DuelJoinResult,
  DuelOverview,
  DuelReadyResult,
  DuelRunResult,
  DuelRunSubmission,
  DuelView,
} from "feature/duels/types/duel.types";
import { auth } from "utils/firebase/client/firebase.utils";

export const duelOverviewQueryKey = (uid: string | null) =>
  ["duels", "overview", uid] as const;

const post = async <T>(
  url: string,
  body: Record<string, unknown> = {},
): Promise<T> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<T>(url, { idToken, ...body });
  return data;
};

export const fetchDuelOverview = () =>
  post<DuelOverview>("/api/duels/overview");

export const fetchDuel = (duelId: string) =>
  post<DuelView>("/api/duels/duel", { duelId });

export const joinDuel = () => post<DuelJoinResult>("/api/duels/join");

export const cancelDuelTicket = (ticketId: string) =>
  post<{ cancelled: boolean }>("/api/duels/cancel", { ticketId });

export const markDuelReady = (duelId: string) =>
  post<DuelReadyResult>("/api/duels/ready", { duelId });

export const submitDuelRun = (run: DuelRunSubmission) =>
  post<DuelRunResult>("/api/duels/submit", { ...run });

/** The API's error code ("LIMIT", "NOT_FOUND"…), when there is one. */
export const duelErrorCode = (error: unknown): string | null =>
  axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
    ? error.response.data.error
    : null;
