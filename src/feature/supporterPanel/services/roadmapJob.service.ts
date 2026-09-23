import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import type {
  RoadmapGoalContext,
  RoadmapJobView,
} from "feature/supporterPanel/types/roadmapJob.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import type { RoadmapLevel } from "lib/roadmaps/generation/levels";
import { auth } from "utils/firebase/client/firebase.utils";

const post = async <T>(path: string, body: Record<string, unknown>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/roadmap-jobs/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "The generation failed.");
  }
  return data as T;
};

export interface StartRoadmapJobResult {
  job: RoadmapJobView;
  charged: boolean;
  tokensCharged: number;
  wallet: SupporterWallet;
}

export interface RoadmapJobRequest {
  title: string;
  goal: string;
  level: RoadmapLevel;
  visibility: RoadmapVisibility;
  context?: RoadmapGoalContext | null;
}

/** Pays for a generation and puts it on the server; nothing is written yet. */
export const startRoadmapJob = (request: RoadmapJobRequest) =>
  post<StartRoadmapJobResult>("start", { ...request });

/** Runs the job for up to a few minutes and answers where it got to. */
export const advanceRoadmapJob = async (ticketId: string) =>
  (await post<{ job: RoadmapJobView | null }>("advance", { ticketId })).job;

/** One job, or — with no id — the player's running one. */
export const fetchRoadmapJob = async (ticketId?: string) =>
  (
    await post<{ job: RoadmapJobView | null }>(
      "status",
      ticketId ? { ticketId } : {},
    )
  ).job;
