const BPM_STEP = 10;

/**
 * Generate BPM stages from min to max (inclusive) in steps of 10.
 * Returns an empty array if metronomeSpeed is null.
 */
export const generateBpmStages = (
  metronomeSpeed: { min: number; max: number; recommended: number } | null
): number[] => {
  if (!metronomeSpeed) return [];

  const { min, max } = metronomeSpeed;
  const alignedMin = Math.floor(min / BPM_STEP) * BPM_STEP;
  const alignedMax = Math.ceil(max / BPM_STEP) * BPM_STEP;

  const stages: number[] = [];
  for (let bpm = alignedMin; bpm <= alignedMax; bpm += BPM_STEP) {
    stages.push(bpm);
  }
  return stages;
};
