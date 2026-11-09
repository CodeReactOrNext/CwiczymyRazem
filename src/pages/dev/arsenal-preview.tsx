// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { useQueryClient } from "@tanstack/react-query";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import { ArsenalView } from "feature/arsenal/ArsenalView";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { rollEffectFeatures } from "feature/arsenal/data/effectStats";
import { DROPPABLE_GUITARS } from "feature/arsenal/data/guitarDefinitions";
import { rollItemFeatures } from "feature/arsenal/data/itemStats";
import { rollItemTraits } from "feature/arsenal/data/traits";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import type {
  ArsenalUserData,
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { createDemoStash } from "feature/guitarBuilder/utils/components";
import { setFame, setUserRole } from "feature/user/store/userSlice";
import { changeUserDisplayName } from "feature/user/store/userSlice.asyncThunk";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { useEffect, useState } from "react";
import { useAppDispatch } from "store/hooks";

/** Deterministic PRNG so every reload draws the same stash. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const buildDemoArsenal = (): ArsenalUserData => {
  const rng = seeded(7);
  const inventory: InventoryItem[] = DROPPABLE_GUITARS.filter((_, i) => i % 4 === 0)
    .slice(0, 24)
    .map((def, i) => {
      const rolled = rollItemFeatures(def, rng);
      return {
        id: `g${i}`,
        guitarId: def.id,
        acquiredAt: 1_700_000_000_000 + i,
        isNew: i < 2,
        year: def.yearFrom,
        country: def.countries[0],
        condition: rng(),
        serial: 1 + Math.floor(rng() * 400),
        stats: rolled?.stats,
        features: rolled?.features,
        traits: rollItemTraits(def.rarity, "guitar", undefined, rng),
      };
    });
  const effectInventory: EffectInventoryItem[] = EFFECT_DEFINITIONS.filter((_, i) => i % 5 === 0)
    .slice(0, 12)
    .map((def, i) => {
      const rolled = rollEffectFeatures(def.rarity, def.type, rng);
      return {
        id: `e${i}`,
        effectId: def.id,
        acquiredAt: 1_700_000_000_000 + i,
        isNew: false,
        condition: rng(),
        serial: 1 + Math.floor(rng() * 400),
        stats: rolled?.stats,
        features: rolled?.features,
      };
    });
  return {
    inventory,
    equippedGuitarId: inventory[0]?.guitarId ?? null,
    equippedItemId: inventory[0]?.id ?? null,
    rig: { ...DEFAULT_RIG, guitarSlots: ["g0", "g1", null] },
    effectInventory,
    parts: [],
    components: createDemoStash(3, 10).slice(0, 40),
    caseTokens: 2,
  } as ArsenalUserData;
};

/**
 * Dev-only: the Arsenal inside the app shell on a seeded fake stash, for layout
 * and theme checks without signing in. Trader / market tabs still call the real
 * API and stay empty. Renders nothing outside development.
 */
export default function ArsenalPreviewPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  // Seeded before the first render, so the view never fires the real fetch.
  useState(() => {
    queryClient.setQueryDefaults(ARSENAL_QUERY_KEY, { staleTime: Infinity });
    queryClient.setQueryData(ARSENAL_QUERY_KEY, buildDemoArsenal());
    return true;
  });

  useEffect(() => {
    dispatch(changeUserDisplayName.fulfilled("Riffer", "dev", "Riffer"));
    dispatch({ type: "user/addUserData", payload: { ...statisticsInitial, lvl: 60 } });
    dispatch(setFame(48_000));
    dispatch(setUserRole("admin"));
  }, [dispatch]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <MainLoggedLayout
      pageId='arsenal'
      variant='secondary'
      userStats={{ ...statisticsInitial, lvl: 60, fame: 48_000 }}
      userName='Riffer'>
      <ArsenalView />
    </MainLoggedLayout>
  );
}
