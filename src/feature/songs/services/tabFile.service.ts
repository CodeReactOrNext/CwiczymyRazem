import { packToTab } from "feature/songPack/utils/packToTab";
import { isSongPackTab, readSongPackTab } from "feature/songPack/utils/songPackFiles";

import type { ParsedGp } from "./gp5Parser.service";
import { parseGpFile } from "./gp5Parser.service";

/**
 * Reads a tab file from the player's library, whichever kind it is: a Guitar
 * Pro file, or the tab the desktop app made out of a song package. Both come
 * out in the same shape, so nothing past this point needs to know which it was.
 */
export const parseTabFile = async (file: File): Promise<ParsedGp> =>
  isSongPackTab(file.name) ? packToTab(await readSongPackTab(file)).parsed : parseGpFile(file);
