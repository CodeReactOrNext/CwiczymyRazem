import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

import type { ArsenalUserData, CaseType, OpenCaseResult, OpenEffectPackResult, PedalboardPlacement,RigSetup } from "../types/arsenal.types";

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

export const sellGuitar = async (inventoryItemId: string): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>("/api/arsenal/sell-guitar", {
    idToken,
    inventoryItemId,
  });
  return data;
};

export const sellEffect = async (inventoryItemId: string): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>("/api/arsenal/sell-effect", {
    idToken,
    inventoryItemId,
  });
  return data;
};
