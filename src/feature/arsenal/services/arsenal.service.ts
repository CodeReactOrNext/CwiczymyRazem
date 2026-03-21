import type { CaseType, OpenCaseResult, ArsenalUserData } from "../types/arsenal.types";
import { auth } from "utils/firebase/client/firebase.utils";
import axios from "axios";

async function getIdToken(): Promise<string> {
  const token = await auth.currentUser!.getIdToken();
  return token;
}

export const openCase = async (caseType: CaseType): Promise<OpenCaseResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<OpenCaseResult>("/api/arsenal/open-case", {
    idToken,
    caseType,
  });
  return data;
};

export const fetchInventory = async (): Promise<ArsenalUserData & { fame: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ArsenalUserData & { fame: number }>(
    "/api/arsenal/inventory",
    { idToken }
  );
  return data;
};

export const equipGuitar = async (guitarId: number | string): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/equip-guitar", { idToken, guitarId });
};

export const clearNewFlags = async (): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/clear-new-flags", { idToken });
};
