import type { AmbientBand } from "./ambientBand";

let active: AmbientBand | null = null;

/**
 * The band of the session playing now, for whoever plays along with it — a
 * boss fight's hits, played by the band on its grid. Set by the tab player
 * that owns the band; cleared by it, and only for its own band.
 */
export const setActiveBand = (band: AmbientBand) => {
  active = band;
};

export const clearActiveBand = (band: AmbientBand) => {
  if (active === band) active = null;
};

export const activeBand = () => active;
