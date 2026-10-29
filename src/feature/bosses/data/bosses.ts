import type { BossDefinition } from "../types/boss.types";
import { CHANGELING } from "./changeling";
import { COLOSSUS } from "./colossus";
import { FRETWEAVER } from "./fretweaver";

export const BOSSES: readonly BossDefinition[] = [FRETWEAVER, COLOSSUS, CHANGELING];

export const getBoss = (id: string): BossDefinition | undefined =>
  BOSSES.find((boss) => boss.id === id);
