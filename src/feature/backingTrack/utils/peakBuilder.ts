/**
 * Builds a waveform out of audio heard as it plays.
 *
 * An imported file can be decoded in one go, so its peaks arrive complete. A
 * YouTube video can't: its audio only exists while it is playing, and the only
 * way to read it is to listen. So the waveform is accumulated a bucket at a
 * time, and the thing that makes that work is indexing by the *recording's* own
 * clock rather than by wall time — a pause, a seek, or a second pass then all
 * land in the right place instead of smearing the picture.
 *
 * Two levels are kept per bucket. The peak is the body of the wave, which is
 * what a waveform normally looks like. The onset is what alignment actually
 * needs: a loud mix is a solid block at peak level, with nothing in it to line a
 * bar up against, while the same passage as attack strength is a row of drum
 * hits you can put a downbeat on.
 *
 * Pure, so the accumulation can be tested without an audio device.
 */

/**
 * Storage form: one byte per bucket, with 0 reserved for "never listened here".
 *
 * That sentinel is what makes a half-finished learn resumable — silence that was
 * actually heard has to be distinguishable from a gap, or a second pass would
 * re-listen to parts it already knows and coverage could never reach 1.
 */
const PACK_MAX = 254;

/**
 * Longest gap a single reading may be stretched over, in buckets.
 *
 * Deliberately small. This used to be two hundred, back when readings came in
 * on animation frames — which meant that a tab left in the background, where
 * frames are throttled to a crawl, painted more than a second of the recording
 * flat at whatever level happened to be sounding when the frame finally ran, and
 * marked all of it heard so no later pass would ever correct it. Readings now
 * arrive from the audio thread every 2.7 ms, so anything spanning more than a
 * few buckets is a discontinuity rather than a long reading.
 */
const MAX_SPAN_BUCKETS = 8;

export interface PeakBuilder {
  /**
   * Records what was heard around `sec` of the recording.
   *
   * `onset` is optional: a caller with no attack measurement of its own leaves
   * that channel alone rather than filling it with the peak, which would make
   * the onset track a duplicate of the body and useless for alignment.
   */
  observe(sec: number, level: number, onset?: number): void;
  /**
   * Records a reading across everything between two moments.
   *
   * A block of audio covers a span of the recording rather than an instant, and
   * at anything above 1× it covers more of it. Attributing each reading to a
   * single point would leave gaps between them.
   */
  observeSpan(fromSec: number, toSec: number, level: number, onset?: number): void;
  /** Peaks so far, normalised 0..1 — the shape useWaveformPeaks produces. */
  snapshot(): Float32Array;
  /** Attack strength so far, normalised 0..1, on the same grid as the peaks. */
  onsetSnapshot(): Float32Array;
  /**
   * What the two snapshots were divided by to reach 0..1.
   *
   * Both are normalised on the way out, so a stored waveform has lost the scale
   * it was measured on. Resuming one without putting that scale back means the
   * old pass and the new one are measured in different units: the attack channel
   * in particular runs an order of magnitude below full scale, so the resumed
   * half of the waveform would draw as a flat line beside the first half.
   */
  scales(): { peak: number; onset: number };
  /** 0..1: how much of the recording has been heard at least once. */
  coverage(): number;
  /** Which buckets have been heard — 1 per bucket, for resuming a partial pass. */
  seenMask(): Uint8Array;
  /**
   * Extends the buffer when the recording turns out to be longer than it said.
   *
   * A player does not always know its own length the moment it can be asked —
   * YouTube in particular will answer with a provisional duration while it is
   * still loading. Sizing the buffer once from that answer meant everything past
   * it was silently dropped: the waveform would fill in for a while and then
   * stop, for the rest of the song, with nothing to show why.
   *
   * Growing is always safe: the grid and the origin are unchanged, so every
   * bucket already recorded keeps its index.
   */
  grow(durationSec: number): void;
  /** Buckets per second — the horizontal resolution. */
  bucketsPerSecond: number;
  durationSec: number;
}

/** A previous session's waveform, to carry on filling in. */
export interface PeakBuilderRestore {
  peaks: Float32Array;
  seen: Uint8Array;
  /** Absent for waveforms saved before attacks were measured separately. */
  onsets?: Float32Array;
  /** What the stored values were normalised by — see PeakBuilder.scales. Each
   *  defaults to 1, which is right for anything already on a 0..1 footing. */
  peakScale?: number;
  onsetScale?: number;
}

/**
 * `durationSec` sizes the buffer up front, so it has to be the video's real
 * length. Anything heard past it is dropped rather than growing the array from
 * a bad reading.
 */
export function createPeakBuilder(
  durationSec: number,
  bucketsPerSecond: number,
  restore?: PeakBuilderRestore,
): PeakBuilder {
  let durationNow = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  let count = Math.max(1, Math.ceil(durationNow * bucketsPerSecond));
  let levels = new Float32Array(count);
  let onsets = new Float32Array(count);
  // Silence is a real observation — "heard nothing here" is not the same as
  // "never listened here" — so what has been covered is tracked separately.
  let seen = new Uint8Array(count);
  let seenCount = 0;
  let loudest = 0;
  let loudestOnset = 0;

  // Carrying a previous pass forward is only safe on the same grid. A *shorter*
  // one is fine — it is a prefix, recorded at the same resolution from the same
  // origin — which is what makes a pass saved under a provisional duration
  // usable once the real one is known.
  if (restore && restore.peaks.length === restore.seen.length && restore.peaks.length <= count) {
    // Back onto the scale it was measured on, so a level heard now and a level
    // heard last week mean the same thing when the two are compared.
    const peakScale = restore.peakScale && restore.peakScale > 0 ? restore.peakScale : 1;
    const onsetScale = restore.onsetScale && restore.onsetScale > 0 ? restore.onsetScale : 1;

    for (let i = 0; i < restore.peaks.length; i += 1) {
      const level = restore.peaks[i] * peakScale;
      levels[i] = level;
      if (level > loudest) loudest = level;
      const onset = (restore.onsets?.[i] ?? 0) * onsetScale;
      onsets[i] = onset;
      if (onset > loudestOnset) loudestOnset = onset;
      if (restore.seen[i]) {
        seen[i] = 1;
        seenCount += 1;
      }
    }
  }

  const normalised = (source: Float32Array, peak: number): Float32Array => {
    const out = new Float32Array(count);
    if (peak <= 0) return out;
    for (let i = 0; i < count; i += 1) out[i] = source[i] / peak;
    return out;
  };

  const builder: PeakBuilder = {
    bucketsPerSecond,
    get durationSec() {
      return durationNow;
    },

    grow(nextDurationSec: number): void {
      if (!Number.isFinite(nextDurationSec) || nextDurationSec <= durationNow) return;
      const nextCount = Math.max(1, Math.ceil(nextDurationSec * bucketsPerSecond));
      durationNow = nextDurationSec;
      if (nextCount <= count) return;

      const grownLevels = new Float32Array(nextCount);
      grownLevels.set(levels);
      const grownOnsets = new Float32Array(nextCount);
      grownOnsets.set(onsets);
      const grownSeen = new Uint8Array(nextCount);
      grownSeen.set(seen);
      levels = grownLevels;
      onsets = grownOnsets;
      seen = grownSeen;
      count = nextCount;
    },

    observe(sec: number, level: number, onset?: number): void {
      if (!Number.isFinite(sec) || sec < 0 || !Number.isFinite(level)) return;
      const index = Math.floor(sec * bucketsPerSecond);
      if (index < 0 || index >= count) return;

      const magnitude = Math.abs(level);
      // A bucket spans several blocks, and a transient is the loudest moment in
      // it — averaging would file the attacks off the very thing this is for.
      if (magnitude > levels[index]) levels[index] = magnitude;
      if (magnitude > loudest) loudest = magnitude;

      if (onset !== undefined && Number.isFinite(onset)) {
        const attack = Math.abs(onset);
        if (attack > onsets[index]) onsets[index] = attack;
        if (attack > loudestOnset) loudestOnset = attack;
      }

      if (!seen[index]) {
        seen[index] = 1;
        seenCount += 1;
      }
    },

    observeSpan(fromSec: number, toSec: number, level: number, onset?: number): void {
      if (!Number.isFinite(fromSec) || !Number.isFinite(toSec)) return;
      const start = Math.min(fromSec, toSec);
      const end = Math.max(fromSec, toSec);

      // Checked against the span the caller actually claimed, before it is
      // clipped to the buffer: a jump from the last second of the recording to
      // somewhere past its end is still a jump, and clipping first would let it
      // through as a short, innocent-looking span.
      if ((end - start) * bucketsPerSecond > MAX_SPAN_BUCKETS) {
        // A seek jumps the clock; filling everything in between would paint the
        // skipped part with whatever happened to be sounding at the landing
        // point. Only that landing point was genuinely heard.
        builder.observe(end, level, onset);
        return;
      }

      const firstIndex = Math.max(0, Math.floor(start * bucketsPerSecond));
      const lastIndex = Math.min(count - 1, Math.floor(end * bucketsPerSecond));
      if (lastIndex < firstIndex) return;

      for (let i = firstIndex; i <= lastIndex; i += 1) {
        builder.observe((i + 0.5) / bucketsPerSecond, level, onset);
      }
    },

    snapshot: () => normalised(levels, loudest),
    onsetSnapshot: () => normalised(onsets, loudestOnset),
    scales: () => ({ peak: loudest, onset: loudestOnset }),

    coverage(): number {
      return count === 0 ? 0 : seenCount / count;
    },

    seenMask(): Uint8Array {
      return Uint8Array.from(seen);
    },
  };

  return builder;
}

/**
 * Normalised peaks → one byte each, for keeping between sessions.
 *
 * `seen` decides which buckets are recorded at all: an unheard one stores 0, and
 * a heard one stores its level shifted up by one so that even silence reads back
 * as "listened to". Omit it and every bucket counts as heard.
 */
export function packPeaks(peaks: Float32Array, seen?: Uint8Array): Uint8Array {
  const out = new Uint8Array(peaks.length);
  for (let i = 0; i < peaks.length; i += 1) {
    if (seen && !seen[i]) continue;
    const clamped = Math.min(1, Math.max(0, peaks[i]));
    out[i] = 1 + Math.round(clamped * PACK_MAX);
  }
  return out;
}

/** The inverse — what comes back out of storage, ready to draw. */
export function unpackPeaks(bytes: Uint8Array): Float32Array {
  const out = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i] === 0 ? 0 : (bytes[i] - 1) / PACK_MAX;
  }
  return out;
}

/** Which buckets the stored waveform was actually listened to. */
export function unpackSeen(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[i] = bytes[i] === 0 ? 0 : 1;
  return out;
}

/** How much of the body survives the blend below. Enough to see the shape of
 *  the song, not enough to bury the attacks in it. */
const BODY_IN_BLEND = 0.4;

/**
 * The picture actually worth drawing: attacks over a hint of the body.
 *
 * Amplitude alone is a poor thing to align against. A loud passage of a modern
 * mix sits at peak level from end to end, so it draws as a solid block with
 * nothing in it to put a bar line on. Attack strength draws the same passage as
 * a row of hits — but on its own it loses the song's shape, and a quiet intro
 * becomes indistinguishable from silence nobody has listened to yet. Both,
 * together, are legible.
 *
 * Returns the peaks untouched when there are no onsets to blend, so a waveform
 * saved before attacks were measured still draws.
 */
export function blendForDisplay(
  peaks: Float32Array | null,
  onsets: Float32Array | null,
): Float32Array | null {
  if (!peaks) return null;
  if (!onsets || onsets.length !== peaks.length) return peaks;

  const out = new Float32Array(peaks.length);
  let anyOnset = false;
  for (let i = 0; i < peaks.length; i += 1) {
    if (onsets[i] > 0) anyOnset = true;
    out[i] = Math.max(onsets[i], peaks[i] * BODY_IN_BLEND);
  }
  // Nothing was ever measured in the onset channel, so the blend would be the
  // body scaled down — dimmer than the peaks, and no more informative.
  return anyOnset ? out : peaks;
}

/**
 * Attack strength from a block's high-passed level, as a running detector.
 *
 * Onset strength is a *rise*, not a level: a sustained cymbal wash is as loud as
 * the snare that started it, and only the snare marks a beat. So each block is
 * measured against a slowly falling memory of the ones before it, and what is
 * kept is how far above that memory it rose.
 *
 * Stateful across blocks and driven entirely by its own arguments, so a whole
 * pass can be replayed in a test.
 */
export interface OnsetDetector {
  /** Attack strength for this block, 0 when nothing rose. */
  push(highPassedLevel: number): number;
  /** Forgets the run so far — after a seek, the previous block is not the
   *  previous moment of the recording and differencing against it is noise. */
  reset(): void;
}

/** How fast the memory follows a rise, and how fast it falls back. Rising
 *  slowly is the point: a fast follower would climb onto the attack itself. */
const ENVELOPE_ATTACK = 0.08;
const ENVELOPE_RELEASE = 0.02;

export function createOnsetDetector(): OnsetDetector {
  let envelope = 0;
  let primed = false;

  return {
    push(highPassedLevel: number): number {
      const level = Number.isFinite(highPassedLevel) ? Math.abs(highPassedLevel) : 0;
      if (!primed) {
        // The first block of a run has nothing to have risen above, and calling
        // it an attack would put a spike wherever listening happened to resume.
        envelope = level;
        primed = true;
        return 0;
      }

      const rise = Math.max(0, level - envelope);
      envelope +=
        level > envelope
          ? (level - envelope) * ENVELOPE_ATTACK
          : (level - envelope) * ENVELOPE_RELEASE;
      return rise;
    },

    reset(): void {
      envelope = 0;
      primed = false;
    },
  };
}
