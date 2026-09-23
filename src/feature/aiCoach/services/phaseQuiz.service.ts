import { auth } from "utils/firebase/client/firebase.utils";

import type { PhaseQuiz } from "../types/phaseCheck.types";

/**
 * The checkpoint quiz of one phase. A signed-in player sends their id token;
 * the admin editor, which may run without one, sends its password instead.
 */
export const fetchPhaseQuiz = async (
  roadmapId: string,
  phaseId: string,
  adminPassword?: string,
): Promise<PhaseQuiz> => {
  const idToken = adminPassword
    ? undefined
    : await auth.currentUser?.getIdToken();
  if (!idToken && !adminPassword)
    throw new Error("Sign in to sit a checkpoint.");

  const res = await fetch("/api/roadmap-phase-quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
    },
    body: JSON.stringify({ idToken, roadmapId, phaseId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.message || data.error || "Could not load the checkpoint.",
    );
  }
  return data.quiz as PhaseQuiz;
};
