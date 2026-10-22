import type { BossDefinition } from "../types/boss.types";
import { COLOSSUS } from "./colossus";
import { FRETWEAVER } from "./fretweaver";

export const BOSSES: readonly BossDefinition[] = [FRETWEAVER, COLOSSUS];

export const getBoss = (id: string): BossDefinition | undefined =>
  BOSSES.find((boss) => boss.id === id);
