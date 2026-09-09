/** Bottom of the meter scale — anything quieter reads as silence. */
export const METER_FLOOR_DB = -60;
/** Linear peak at/above which the converter is treated as clipping. */
export const CLIP_PEAK = 0.99;

export const peakToDb = (peak: number): number =>
  20 * Math.log10(Math.max(peak, 1e-6));

/** 0..1 fill fraction for a bar spanning METER_FLOOR_DB..0 dBFS. */
export const peakToMeterFraction = (peak: number): number => {
  const db = peakToDb(peak);
  return Math.min(1, Math.max(0, (db - METER_FLOOR_DB) / -METER_FLOOR_DB));
};

/** Meter zone by peak — drives the bar colour. */
export const meterZone = (peak: number): "quiet" | "ok" | "hot" | "clip" => {
  if (peak >= CLIP_PEAK) return "clip";
  const db = peakToDb(peak);
  if (db > -6) return "hot";
  if (db > -40) return "ok";
  return "quiet";
};
