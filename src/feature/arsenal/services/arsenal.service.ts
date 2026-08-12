import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

import type {
  ArsenalUserData,
  CaseType,
  OpenCaseResult,
  OpenEffectPackResult,
  PartId,
  PartTier,
  PedalboardPlacement,
  RigSetup,
  ScrapResult,
  WorkshopBuildResult,
  WorkshopKind,
  WorkshopModAction,
  WorkshopModResult,
  WorkshopRepairResult,
} from "../types/arsenal.types";

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

export const fetchInventory = async (): Promise<
  ArsenalUserData & { fame: number }
> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ArsenalUserData & { fame: number }>(
    "/api/arsenal/inventory",
    { idToken },
  );
  return data;
};

export const equipGuitar = async (
  guitarId: number | string,
  itemId?: string,
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/equip-guitar", { idToken, guitarId, itemId });
};

export const unequipGuitar = async (): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/unequip-guitar", { idToken });
};

export const clearNewFlags = async (): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/clear-new-flags", { idToken });
};

export const updateRig = async (
  rig: RigSetup,
  selectedGuitar?: string | number | null,
  selectedGuitarYear?: number,
  selectedGuitarCountry?: string,
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/update-rig", {
    idToken,
    rig,
    selectedGuitar,
    selectedGuitarYear,
    selectedGuitarCountry,
  });
};

const openEffectPack = async (): Promise<OpenEffectPackResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<OpenEffectPackResult>(
    "/api/arsenal/open-effect-pack",
    { idToken },
  );
  return data;
};

export const updateStashLayout = async (
  layout: Record<string, number>,
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/update-stash-layout", { idToken, layout });
};

export const updatePedalboard = async (
  items: PedalboardPlacement[],
): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/update-pedalboard", { idToken, items });
};

export const sellGuitar = async (
  inventoryItemId: string,
): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/sell-guitar",
    {
      idToken,
      inventoryItemId,
    },
  );
  return data;
};

export const sellGuitarsBulk = async (
  inventoryItemIds: string[],
): Promise<{ fameReward: number; soldCount: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number; soldCount: number }>(
    "/api/arsenal/sell-guitars-bulk",
    { idToken, inventoryItemIds },
  );
  return data;
};

export const sellEffect = async (
  inventoryItemId: string,
): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/sell-effect",
    {
      idToken,
      inventoryItemId,
    },
  );
  return data;
};

export const sellSalvagedMod = async (
  modId: string,
): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/sell-mod",
    {
      idToken,
      modId,
    },
  );
  return data;
};

export const sellPart = async (
  partId: PartId,
  tier: PartTier,
  qty: number,
): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/sell-part",
    {
      idToken,
      partId,
      tier,
      qty,
    },
  );
  return data;
};

export const scrapGuitar = async (
  inventoryItemId: string,
): Promise<ScrapResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ScrapResult>("/api/arsenal/scrap-guitar", {
    idToken,
    inventoryItemId,
  });
  return data;
};

export const scrapEffect = async (
  inventoryItemId: string,
): Promise<ScrapResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ScrapResult>("/api/arsenal/scrap-effect", {
    idToken,
    inventoryItemId,
  });
  return data;
};

export const buildItem = async (
  itemId: string,
  kind: WorkshopKind,
): Promise<WorkshopBuildResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<WorkshopBuildResult>(
    "/api/arsenal/workshop/build",
    {
      idToken,
      itemId,
      kind,
    },
  );
  return data;
};

export const repairItem = async (
  itemId: string,
  kind: WorkshopKind,
): Promise<WorkshopRepairResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<WorkshopRepairResult>(
    "/api/arsenal/workshop/repair",
    {
      idToken,
      itemId,
      kind,
    },
  );
  return data;
};

/**
 * Fits or re-rolls one named mod. Which one is the player's call; the value is
 * rolled server-side. A `fit-salvaged` job names a stash entry instead of a
 * feature, and brings its own value with it.
 */
export const modItem = async (
  itemId: string,
  kind: WorkshopKind,
  featureId: string | null,
  action: WorkshopModAction,
  salvagedId?: string,
): Promise<WorkshopModResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<WorkshopModResult>(
    "/api/arsenal/workshop/mod",
    {
      idToken,
      itemId,
      kind,
      featureId,
      action,
      salvagedId,
    },
  );
  return data;
};

export const sellEffectsBulk = async (
  inventoryItemIds: string[],
): Promise<{ fameReward: number; soldCount: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number; soldCount: number }>(
    "/api/arsenal/sell-effects-bulk",
    { idToken, inventoryItemIds },
  );
  return data;
};
