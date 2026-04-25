import type { CaseType, OpenCaseResult, ArsenalUserData, RigSetup, OpenEffectPackResult, PedalboardPlacement } from "../types/arsenal.types";
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

export const updateRig = async (rig: RigSetup, selectedGuitar?: string | number | null, selectedGuitarYear?: number, selectedGuitarCountry?: string): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/update-rig", { idToken, rig, selectedGuitar, selectedGuitarYear, selectedGuitarCountry });
};

const openEffectPack = async (): Promise<OpenEffectPackResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<OpenEffectPackResult>("/api/arsenal/open-effect-pack", { idToken });
  return data;
};

export const updatePedalboard = async (items: PedalboardPlacement[]): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/update-pedalboard", { idToken, items });
};
