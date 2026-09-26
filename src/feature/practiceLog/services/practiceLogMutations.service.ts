import axios from "axios";
import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import { auth } from "utils/firebase/client/firebase.utils";

const MANAGE_REPORT_URL = "/api/user/report/manage";

async function getIdToken(): Promise<string> {
  const token = await auth.currentUser!.getIdToken();
  return token;
}

export interface UpdatePracticeReportPayload {
  reportId: string;
  title: string;
  description?: string;
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  };
}

export const updatePracticeReport = async ({
  reportId,
  title,
  description,
  timeSumary,
}: UpdatePracticeReportPayload): Promise<void> => {
  const idToken = await getIdToken();
  await axios.patch(MANAGE_REPORT_URL, {
    idToken,
    reportId,
    updates: { title, description, timeSumary },
  });
};

/**
 * Sets only the session's note. Unlike `updatePracticeReport` this works on
 * plan and song reports too — the note carries no stats.
 */
export const saveReportNote = async (
  reportId: string,
  description: string
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.patch(MANAGE_REPORT_URL, {
    idToken,
    reportId,
    updates: { description },
  });
  // The summary screen has already re-fetched the logs into the client cache
  // (weekly chart), so without this the practice log serves the note-less copy.
  // The API's own invalidation only clears the server's memory.
  const uid = auth.currentUser?.uid;
  if (uid) invalidateActivityLogsCache(uid);
};

export const deletePracticeReport = async (reportId: string): Promise<void> => {
  const idToken = await getIdToken();
  await axios.delete(MANAGE_REPORT_URL, { data: { idToken, reportId } });
};
