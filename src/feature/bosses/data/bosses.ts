import type { BossDefinition } from "../types/boss.types";
import { CHANGELING } from "./changeling";
import { COLOSSUS } from "./colossus";
import { FRETWEAVER } from "./fretweaver";

export const BOSSES: readonly BossDefinition[] = [FRETWEAVER, COLOSSUS, CHANGELING];

export const getBoss = (id: string): BossDefinition | undefined =>
  BOSSES.find((boss) => boss.id === id);

/** What a fight's session plan id starts with — `boss-fretweaver`; the feed tells a fight's log by it. */
export const BOSS_PLAN_PREFIX = "boss-";
