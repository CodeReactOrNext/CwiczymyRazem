/** What a player says on a beat when counting the bar out loud. */
export interface BeatCount {
  /** "1", "2" … on the beat; "e", "&", "a" on its sixteenths. */
  label: string;
  /** True for the numbers — the beats themselves. */
  onBeat: boolean;
}

interface CountedBeat {
  /** Where the beat starts, in quarter notes from the start of the tab. */
  offsetX: number;
}

interface TimeSigChange {
  /** Where the signature takes over, in quarter notes from the start of the tab. */
  x: number;
  sig: readonly [number, number];
}

const EPS = 1e-6;
/** How far off the sixteenth grid a beat may sit and still be counted. */
const GRID_TOLERANCE = 0.02;

/** Length of one counted beat, in quarter notes: a quarter in x/4, an eighth in x/8. */
function countUnit(sig: readonly [number, number] | undefined): number {
  const denominator = sig?.[1] ?? 4;
  return denominator > 0 ? 4 / denominator : 1;
}

/** The time signature in force at `beat`. `changes` run left to right. */
function signatureAt(changes: readonly TimeSigChange[], beat: number): readonly [number, number] | undefined {
  let sig: readonly [number, number] | undefined;
  for (const change of changes) {
    if (change.x > beat + EPS) break;
    sig = change.sig;
  }
  return sig;
}

/**
 * How each beat is counted: "1 e & a 2 e & a …", restarting in every bar and
 * following the time signature (six counts in 6/8, not two). A beat that falls
 * off the sixteenth grid — the inside of a triplet — gets no count (null).
 */
export function beatCountLabels(
  beats: readonly CountedBeat[],
  measureEndXs: readonly number[],
  timeSigChanges: readonly TimeSigChange[],
): (BeatCount | null)[] {
  let bar = 0;
  return beats.map((beat) => {
    while (bar < measureEndXs.length - 1 && beat.offsetX >= measureEndXs[bar] - EPS) bar++;
    const barStart = bar === 0 ? 0 : measureEndXs[bar - 1];
    const position = (beat.offsetX - barStart) / countUnit(signatureAt(timeSigChanges, barStart));
    const whole = Math.floor(position + EPS);
    const fraction = position - whole;
    if (fraction < GRID_TOLERANCE) return { label: String(whole + 1), onBeat: true };
    if (Math.abs(fraction - 0.25) < GRID_TOLERANCE) return { label: "e", onBeat: false };
    if (Math.abs(fraction - 0.5) < GRID_TOLERANCE) return { label: "&", onBeat: false };
    if (Math.abs(fraction - 0.75) < GRID_TOLERANCE) return { label: "a", onBeat: false };
    return null;
  });
}

/**
 * Where the counted beats fall inside the bars, in quarter notes from the start
 * of the tab — every beat but each bar's first, which the bar line marks.
 */
export function beatTickPositions(
  measureEndXs: readonly number[],
  timeSigChanges: readonly TimeSigChange[],
): number[] {
  const ticks: number[] = [];
  let barStart = 0;
  for (const barEnd of measureEndXs) {
    const unit = countUnit(signatureAt(timeSigChanges, barStart));
    for (let beat = barStart + unit; beat < barEnd - EPS; beat += unit) ticks.push(beat);
    barStart = barEnd;
  }
  return ticks;
}
