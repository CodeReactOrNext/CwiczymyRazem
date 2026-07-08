import axios from "axios";
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

export const deletePracticeReport = async (
  reportId: string
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.delete(MANAGE_REPORT_URL, { data: { idToken, reportId } });
};
