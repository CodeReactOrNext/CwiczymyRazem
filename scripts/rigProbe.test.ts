// @vitest-environment node
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON=")) continue;
      let v = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
      if (v) return v;
    }
  }
  return undefined;
};

const out: string[] = [];
const log = (l = "") => out.push(l);
const isMode = (import.meta as any).env?.MODE === "rig-probe";

(isMode ? describe : describe.skip)("Rig probe", () => {
  it("dumps one account's arsenal shape", async () => {
    const uid = process.env.AUDIT_UID!;
    const sa = readServiceAccountJson()!;
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
    const snap = await admin.firestore().collection("users").doc(uid).get();
    const data = snap.data()!;
    const a = data.arsenal as ArsenalUserData;

    log(`fame ${data.statistics?.fame ?? 0} | stored rigLevel ${data.rigLevel ?? "-"} | computed ${getRigLevel(a)}`);
    log(`inventory: ${a.inventory?.length ?? 0} guitars, ${a.effectInventory?.length ?? 0} pedals`);
    log(`dex: guitars ${a.dexGuitars?.length ?? 0}/${GUITAR_DEFINITIONS.length}, effects ${a.dexEffects?.length ?? 0}/${EFFECT_DEFINITIONS.length}`);
    log(`rig: boardTier ${a.rig?.boardTier ?? 0} supplyTier ${a.rig?.supplyTier ?? 0} | slots ${(a.rig?.guitarSlots ?? []).filter(Boolean).length}/3 | board ${a.rig?.pedalboardItems?.length ?? 0} pedals | power links ${a.rig?.power?.length ?? "absent"}`);
    log(`parts stacks: ${a.parts?.length ?? 0} | salvaged mods: ${a.salvagedMods?.length ?? 0}`);

    const rar: Record<string, number> = {};
    let maxLvl = 0, maxBuild = 0, museum = 0, restored = 0, traits = 0, withTraits = 0;
    for (const it of a.inventory ?? []) {
      const def = GUITARS_BY_ID.get(it.guitarId);
      if (!def) continue;
      rar[def.rarity] = (rar[def.rarity] || 0) + 1;
      maxLvl = Math.max(maxLvl, getItemLevel(it, def));
      maxBuild = Math.max(maxBuild, it.buildLevel ?? 0);
      if ((it.condition ?? 0) >= 0.92) museum++;
      if (it.restored) restored++;
      if (it.traits?.length) { withTraits++; traits += it.traits.length; }
    }
    for (const it of a.effectInventory ?? []) {
      const def = EFFECTS_BY_ID.get(it.effectId);
      if (!def) continue;
      rar[def.rarity] = (rar[def.rarity] || 0) + 1;
      maxLvl = Math.max(maxLvl, getEffectLevel(it, def));
      maxBuild = Math.max(maxBuild, it.buildLevel ?? 0);
      if ((it.condition ?? 0) >= 0.92) museum++;
      if (it.restored) restored++;
      if (it.traits?.length) { withTraits++; traits += it.traits.length; }
    }
    log(`owned by rarity: ${JSON.stringify(rar)}`);
    log(`best item level ${maxLvl} | best buildLevel ${maxBuild} | Museum-grade ${museum} | restored ${restored}`);
    log(`items with traits ${withTraits}, traits total ${traits}`);
    log("");
    log(`top-level user doc keys: ${Object.keys(data).sort().join(", ")}`);
    log(`statistics keys: ${Object.keys(data.statistics ?? {}).sort().join(", ")}`);
    log(`arsenal keys: ${Object.keys(a ?? {}).sort().join(", ")}`);

    fs.writeFileSync(process.env.AUDIT_OUT!, out.join(String.fromCharCode(10)));
  }, 120 * 1000);
});
