/** Countdown ticks before an attack, at most. */
export const COUNTDOWN_TICKS = 3;

/** Where a run is, in beats since its first one (negative in the count-in). */
export const beatPosition = (now: number, startTime: number, bpm: number) => ((now - startTime) * bpm) / 60;

/** The audio time of beat `beat` of the run. */
export const beatTime = (beat: number, startTime: number, bpm: number) => startTime + (beat * 60) / bpm;

/** The first point of the run's grid (sixteenths by default) at or after audio time `time`. */
export const nextGridTime = (time: number, startTime: number, bpm: number, perBeat = 4) =>
  beatTime(Math.ceil(beatPosition(time, startTime, bpm) * perBeat - 1e-9) / perBeat, startTime, bpm);

/**
 * The whole beats to tick a countdown on, from `position` to an attack at
 * beat `attack`: the last few before it, never one already gone. Beats too
 * close to `position` to be scheduled in time (`lead`) are left out.
 */
export const countdownBeats = (position: number, attack: number, lead = 0.05, ticks = COUNTDOWN_TICKS) => {
  const beats: number[] = [];
  for (let beat = Math.ceil(attack) - 1; beat > position + lead && beats.length < ticks; beat--) beats.unshift(beat);
  return beats;
};

/**
 * The next beat a quake starts on, given where they start in the pass
 * (`starts`, beats from its top) and how long the pass is.
 */
export const nextQuakeStart = (position: number, starts: readonly number[], passBeats: number) => {
  if (!starts.length || passBeats <= 0) return null;
  const pass = Math.floor(position / passBeats);
  const candidates = [pass, pass + 1].flatMap((p) => starts.map((s) => p * passBeats + s));
  const ahead = candidates.filter((beat) => beat > position).sort((a, b) => a - b);
  return ahead[0] ?? null;
};
