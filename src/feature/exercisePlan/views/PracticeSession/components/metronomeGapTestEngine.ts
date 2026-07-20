/**
 * Engine for the "Metronome Gap Test" exercise.
 *
 * The player hears a couple of audible bars, then the click goes silent for a
 * number of bars, and they must tap the *next* downbeat ("1") purely from their
 * internal pulse. We measure how far off the tap landed and grade it.
 *
 * It lives as a module-level singleton (not React state) on purpose: the session
 * renders its desktop and mobile views at the same time (see the double-mount
 * note in PracticeSession), so a component that owned the AudioContext + a global
 * key listener would run twice and produce doubled clicks/taps. Here a single
 * engine drives the audio and the `keydown` listener (ref-counted via
 * retain/release), and every mounted panel just subscribes to the same state.
 */
import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import { applySinkId } from "utils/applyAudioSinkId";

export type GapVerdict = "super" | "good" | "bad" | "miss";
type Phase = "idle" | "lead" | "gap" | "result";

export interface GapAttempt {
  /** Signed deviation in ms (tap − target). null = no tap in time. */
  dev: number | null;
  cls: GapVerdict;
  /** Silent bars in play for this attempt. */
  gap: number;
}

export interface GapTestState {
  phase: Phase;
  running: boolean;
  /** Tempo in BPM (this exercise brings its own metronome). */
  bpm: number;
  /** Number of silent bars — grows by 1 on every "super". */
  gapBars: number;
  /** Currently lit metronome LED during the audible bars (0..3), or -1. */
  ledIndex: number;
  ledAccent: boolean;
  /** During the gap: 0-based index of the current silent bar, or -1. */
  silentBar: number;
  /** True in the final silent bar — the target downbeat is approaching. */
  getReady: boolean;
  result: { verdict: GapVerdict; dev: number | null } | null;
  history: GapAttempt[];
}

const BEATS_PER_BAR = 4;
const LEAD_BARS = 2; // audible bars before the silence
const T_SUPER = 35; // |dev| <= this ms → "super" (levels up)
const T_GOOD = 80; // |dev| <= this ms → "good"
/**
 * Fixed input-latency compensation (ms). Keyboard/mouse presses register a bit
 * late (hardware debounce + USB polling), so taps read systematically "late".
 * We subtract this constant from every deviation to cancel that bias.
 */
const INPUT_LATENCY_MS = 15;
/** Half-width of the deviation ruler, in ms (used by the UI too). */
export const RULER_RANGE = 200;
export const TEMPO_MIN = 40;
export const TEMPO_MAX = 160;

const INITIAL_STATE: GapTestState = {
  phase: "idle",
  running: false,
  bpm: 80,
  gapBars: 2,
  ledIndex: -1,
  ledAccent: false,
  silentBar: -1,
  getReady: false,
  result: null,
  history: [],
};

class GapTestEngine {
  private state: GapTestState = INITIAL_STATE;
  private listeners = new Set<() => void>();
  private refCount = 0;

  private ctx: AudioContext | null = null;
  // Subscribed once (singleton, module lifetime) so an already-open context moves
  // to a newly picked output device live.
  private unsubOutputDevice = onOutputDeviceChange((id) => applySinkId(this.ctx, id));
  private scheduled: OscillatorNode[] = [];
  private raf = 0;
  private missTimer: ReturnType<typeof setTimeout> | null = null;
  private awaiting = false;
  private round: { beatMs: number; startPerf: number; gapPerf: number; targetPerf: number } | null = null;

  // --- external store API (useSyncExternalStore) ---
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getSnapshot = (): GapTestState => this.state;

  private emit(patch: Partial<GapTestState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /**
   * Ref-counted mount lifecycle. The single global key listener is added on the
   * first retained panel and removed when the last one unmounts, so the
   * double-mounted views share exactly one listener.
   */
  retain() {
    this.refCount += 1;
    if (this.refCount === 1) window.addEventListener("keydown", this.keyHandler);
  }
  release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      window.removeEventListener("keydown", this.keyHandler);
      this.abort();
      // Keep the earned level, calibration and history; just stop any live round.
      this.emit({ phase: "idle", running: false, ledIndex: -1, ledAccent: false });
    }
  }

  private keyHandler = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    if (this.awaiting) {
      e.preventDefault();
      this.tap(e.timeStamp);
    } else if (this.state.running) {
      e.preventDefault(); // swallow scroll while a round is live
    }
  };

  setBpm(bpm: number) {
    this.emit({ bpm: Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(bpm))) });
  }

  reset() {
    if (this.state.running) return;
    this.emit({ gapBars: 2, history: [], result: null, phase: "idle" });
  }

  /** Begin a round at the current tempo using the current level + calibration. */
  start() {
    if (this.state.running) return;
    const ctx = this.ensureCtx();
    void ctx.resume();
    this.stopScheduled();

    const safeBpm = this.state.bpm > 0 ? this.state.bpm : 80;
    const beatS = 60 / safeBpm;
    const beatMs = 60000 / safeBpm;

    const anchorCtx = ctx.currentTime;
    const anchorPerf = performance.now();
    const outLat = ctx.outputLatency || ctx.baseLatency || 0;
    // Map an audio-clock time to the *perceived* performance.now() time so it can
    // be compared against a tap's event.timeStamp (which uses that same clock).
    const ctxToPerf = (t: number) => anchorPerf + (t - anchorCtx) * 1000 + outLat * 1000;

    const startCtx = anchorCtx + 0.25; // small lead-in so scheduling is safe
    const leadBeats = LEAD_BARS * BEATS_PER_BAR;
    for (let i = 0; i < leadBeats; i++) this.click(startCtx + i * beatS, i % BEATS_PER_BAR === 0);

    const targetBeat = (LEAD_BARS + this.state.gapBars) * BEATS_PER_BAR;
    this.round = {
      beatMs,
      startPerf: ctxToPerf(startCtx),
      gapPerf: ctxToPerf(startCtx + leadBeats * beatS),
      targetPerf: ctxToPerf(startCtx + targetBeat * beatS),
    };

    this.awaiting = true;
    this.emit({ running: true, phase: "lead", result: null, ledIndex: -1, ledAccent: false, silentBar: -1, getReady: false });

    if (this.missTimer) clearTimeout(this.missTimer);
    this.missTimer = setTimeout(
      () => {
        if (this.awaiting) this.resolve(null);
      },
      this.round.targetPerf + 2 * beatMs - performance.now(),
    );
    this.loop();
  }

  /** Register a tap. Ignored unless we're waiting and past the audible bars. */
  tap(ts: number) {
    if (!this.awaiting || !this.round) return;
    if (ts < this.round.gapPerf) return; // a tap during the audible lead isn't the answer
    this.resolve(ts);
  }

  private loop = () => {
    const r = this.round;
    if (!r) return;
    const now = performance.now();

    let phase: Phase;
    let ledIndex = -1;
    let ledAccent = false;
    let silentBar = -1;
    let getReady = false;
    if (now < r.gapPerf) {
      phase = "lead";
      const bf = (now - r.startPerf) / r.beatMs;
      const inBar = Math.max(0, Math.floor(bf)) % BEATS_PER_BAR;
      const frac = bf - Math.floor(bf);
      if (frac < 0.26) {
        ledIndex = inBar;
        ledAccent = inBar === 0;
      }
    } else {
      // Silence — no per-beat cue (that's the test), but we track which silent
      // bar we're in so the UI can count down and flag the final "get ready" bar.
      phase = "gap";
      const barsIntoGap = Math.floor((now - r.gapPerf) / r.beatMs / BEATS_PER_BAR);
      silentBar = Math.max(0, Math.min(this.state.gapBars - 1, barsIntoGap));
      getReady = barsIntoGap >= this.state.gapBars - 1;
    }

    if (
      phase !== this.state.phase ||
      ledIndex !== this.state.ledIndex ||
      ledAccent !== this.state.ledAccent ||
      silentBar !== this.state.silentBar ||
      getReady !== this.state.getReady
    ) {
      this.emit({ phase, ledIndex, ledAccent, silentBar, getReady });
    }
    if (this.state.running) this.raf = requestAnimationFrame(this.loop);
  };

  private resolve(ts: number | null) {
    this.awaiting = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.missTimer) {
      clearTimeout(this.missTimer);
      this.missTimer = null;
    }

    const r = this.round;
    let verdict: GapVerdict;
    let dev: number | null;
    if (ts === null || !r) {
      verdict = "miss";
      dev = null;
    } else {
      dev = ts - r.targetPerf - INPUT_LATENCY_MS;
      const abs = Math.abs(dev);
      verdict = abs <= T_SUPER ? "super" : abs <= T_GOOD ? "good" : "bad";
    }

    const rounded = dev === null ? null : Math.round(dev);
    const attempt: GapAttempt = { dev: rounded, cls: verdict, gap: this.state.gapBars };
    this.emit({
      running: false,
      phase: "result",
      ledIndex: -1,
      ledAccent: false,
      silentBar: -1,
      getReady: false,
      result: { verdict, dev: rounded },
      history: [attempt, ...this.state.history].slice(0, 24),
      gapBars: verdict === "super" ? this.state.gapBars + 1 : this.state.gapBars,
    });
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      applySinkId(this.ctx, readPersistedOutputDeviceId());
    }
    return this.ctx;
  }

  private click(t: number, accent: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = accent ? 1760 : 1100;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.7 : 0.4, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
    this.scheduled.push(osc);
  }

  private stopScheduled() {
    this.scheduled.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    this.scheduled = [];
  }

  private abort() {
    this.awaiting = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.missTimer) {
      clearTimeout(this.missTimer);
      this.missTimer = null;
    }
    this.stopScheduled();
    this.round = null;
  }
}

export const gapTestEngine = new GapTestEngine();
