import type { InputTap } from "hooks/guitarBufferProcessor";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import {
  canHearPilot,
  createPilotTracker,
  createProbeSignal,
  isProbeHeard,
  LEAK_MIN_LEVEL,
  PILOT_HZ,
  PILOT_SNR_DB,
  pilotSnrDb,
  probeCaptureLength,
  probeMatch,
} from "utils/audio/playbackLeak";

/** What sent the probe that came back: the tab sound coming on (or a device
 *  change), or the pilot heard mid-run. */
export type PlaybackLeakSource = "probe" | "pilot";

/** The probe's peak relative to the tab sound's own level. Its drops sit at
 *  1.4–3.5 kHz, where the ear is keenest, so they sound far louder than a guitar
 *  note of the same peak — at 0.08 they are a soft patter under the tab, and
 *  still read 0.5+ through a speaker in a noisy room. */
const PROBE_LEVEL = 0.08;
/** The pilot relative to the tab sound's level: far under it, and near-ultrasonic. */
const PILOT_LEVEL = 0.02;
/** The probe goes out this long after the tab sound comes on. */
const PROBE_LEAD_S = 0.05;
/** The pilot starts this long after the tab sound does. The input before it
 *  shows whether the room already holds a tone at its pitch, which would read as ours. */
const PILOT_DELAY_MS = 400;
const PILOT_FADE_S = 0.05;
/** A device change settles — and fires more than once — before the probe goes again. */
const DEVICE_CHANGE_SETTLE_MS = 600;
/** The pilot sends the probe at most this often: a whine at its pitch that
 *  never goes away must not keep dropping the probe on the player. */
const PILOT_PROBE_GAP_MS = 20_000;

interface UsePlaybackLeakGuardOptions {
  /** Worth listening for: the mic is open and the run can land on a board or in a duel. */
  enabled: boolean;
  /** The tab's own guitar is sounding right now. */
  isTabAudible: boolean;
  /** Level the tab sound plays at; the probe and the pilot follow it. */
  tabLevel: number;
  /** The context the tab sound plays through — the probe and the pilot leave the same way. */
  audioContext: AudioContext | null | undefined;
  /** The mic's raw input (AudioRefs.inputTapRef). */
  inputTapRef: MutableRefObject<InputTap | null> | undefined;
  /** The mic heard the playback. Fires again only once it had stopped being heard. */
  onLeak: (source: PlaybackLeakSource) => void;
}

/**
 * Listens for the tab's own guitar reaching the mic. Out of speakers it would
 * score as if the player had played it; in headphones, or into an instrument
 * input, it can't reach the mic at all.
 *
 * Whenever the tab sound comes on it sends a short probe the same way and
 * listens for it, and keeps a quiet pilot tone under the sound for as long as it
 * plays (see utils/audio/playbackLeak.ts). A change of audio device, or the
 * pilot showing up in the mic, sends the probe again. Only the probe decides,
 * and only when it comes back loud enough for the tab to be scored. Returns a
 * ref that reads true while the playback is known to be heard.
 */
export function usePlaybackLeakGuard({
  enabled,
  isTabAudible,
  tabLevel,
  audioContext,
  inputTapRef,
  onLeak,
}: UsePlaybackLeakGuardOptions): MutableRefObject<boolean> {
  const leakingRef = useRef(false);
  const tabLevelRef = useRef(tabLevel);
  const onLeakRef = useRef(onLeak);
  useEffect(() => {
    tabLevelRef.current = tabLevel;
    onLeakRef.current = onLeak;
  });

  const active = enabled && isTabAudible && !!audioContext && !!inputTapRef;

  useEffect(() => {
    if (
      !active ||
      !audioContext ||
      !inputTapRef ||
      audioContext.state === "closed"
    )
      return undefined;
    const ctx = audioContext;
    const level = Math.min(1, Math.max(0.05, tabLevelRef.current));
    let disposed = false;

    const report = (source: PlaybackLeakSource) => {
      if (disposed || leakingRef.current) return;
      leakingRef.current = true;
      onLeakRef.current(source);
    };

    // ── Probe ──
    let probeSource: AudioBufferSourceNode | null = null;
    let probeGeneration = 0;
    let probeReason: PlaybackLeakSource = "probe";
    let capture: {
      samples: Float32Array;
      filled: number;
      sampleRate: number;
      generation: number;
      reason: PlaybackLeakSource;
    } | null = null;
    let awaitingCapture = false;

    const sendProbe = (reason: PlaybackLeakSource) => {
      if (disposed) return;
      try {
        probeSource?.stop();
      } catch {
        /* never started */
      }
      // A guard that can't play its probe stays quiet — it must never take the session down.
      try {
        const signal = createProbeSignal(ctx.sampleRate);
        const buffer = ctx.createBuffer(1, signal.length, ctx.sampleRate);
        buffer.getChannelData(0).set(signal);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = PROBE_LEVEL * level;
        source.connect(gain).connect(ctx.destination);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
        };
        source.start(ctx.currentTime + PROBE_LEAD_S);
        probeSource = source;
      } catch (error) {
        console.warn("Playback leak probe could not be played", error);
        return;
      }
      probeGeneration++;
      probeReason = reason;
      capture = null;
      awaitingCapture = true;
    };

    const listenForProbe = (samples: Float32Array, sampleRate: number) => {
      if (!awaitingCapture) return;
      if (!capture) {
        capture = {
          samples: new Float32Array(probeCaptureLength(sampleRate)),
          filled: 0,
          sampleRate,
          generation: probeGeneration,
          reason: probeReason,
        };
      }
      const take = Math.min(
        samples.length,
        capture.samples.length - capture.filled,
      );
      capture.samples.set(samples.subarray(0, take), capture.filled);
      capture.filled += take;
      if (capture.filled < capture.samples.length) return;
      const done = capture;
      capture = null;
      awaitingCapture = false;
      // Off the audio callback: the correlation is a few large FFTs.
      window.setTimeout(() => {
        if (disposed || done.generation !== probeGeneration) return;
        const match = probeMatch(done.samples, done.sampleRate);
        // The tab goes out 1/PROBE_LEVEL louder than the probe, so it reaches
        // the mic that much louder too.
        if (isProbeHeard(match) && match.level / PROBE_LEVEL >= LEAK_MIN_LEVEL)
          report(done.reason);
      }, 0);
    };

    // ── Pilot ──
    let pilot: { oscillator: OscillatorNode; gain: GainNode } | null = null;
    if (canHearPilot(ctx.sampleRate)) {
      try {
        const oscillator = ctx.createOscillator();
        oscillator.frequency.value = PILOT_HZ;
        const gain = ctx.createGain();
        const startAt = ctx.currentTime + PILOT_DELAY_MS / 1000;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(
          PILOT_LEVEL * level,
          startAt + PILOT_FADE_S,
        );
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        pilot = { oscillator, gain };
      } catch (error) {
        console.warn("Playback leak pilot could not be played", error);
      }
    }
    const tracker = createPilotTracker();
    const startedAt = performance.now();
    let pilotTrusted = !!pilot;
    let pilotJudging = false;
    let baselineWindows = 0;
    let baselineHits = 0;
    let pilotHeard = false;
    let pilotProbedAt = -Infinity;

    const listenForPilot = (samples: Float32Array, sampleRate: number) => {
      if (!pilotTrusted || leakingRef.current) return;
      const snr = pilotSnrDb(samples, sampleRate);
      if (!pilotJudging) {
        if (performance.now() - startedAt < PILOT_DELAY_MS) {
          baselineWindows++;
          if (snr !== null && snr >= PILOT_SNR_DB) baselineHits++;
          return;
        }
        pilotJudging = true;
        // The room already had a tone at the pilot's pitch — ours couldn't be told from it.
        if (baselineWindows > 0 && baselineHits * 2 >= baselineWindows) {
          pilotTrusted = false;
          return;
        }
      }
      // Heard, it only asks the question again — once per stretch it stands,
      // and never so often that the probe turns into a tick.
      const heard = tracker.push(snr, (samples.length / sampleRate) * 1000);
      if (
        heard &&
        !pilotHeard &&
        performance.now() - pilotProbedAt >= PILOT_PROBE_GAP_MS
      ) {
        pilotProbedAt = performance.now();
        sendProbe("pilot");
      }
      pilotHeard = heard;
    };

    const tap: InputTap = (samples, sampleRate) => {
      listenForProbe(samples, sampleRate);
      listenForPilot(samples, sampleRate);
    };
    const previousTap = inputTapRef.current;
    inputTapRef.current = tap;
    sendProbe("probe");

    // Headphones out, a Bluetooth speaker in: whatever was learnt is about the
    // device before, so start over and ask again once the switch has settled.
    let settleTimer: number | undefined;
    const onDeviceChange = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        leakingRef.current = false;
        tracker.reset();
        pilotHeard = false;
        sendProbe("probe");
      }, DEVICE_CHANGE_SETTLE_MS);
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);

    return () => {
      disposed = true;
      leakingRef.current = false;
      window.clearTimeout(settleTimer);
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        onDeviceChange,
      );
      if (inputTapRef.current === tap) inputTapRef.current = previousTap;
      try {
        probeSource?.stop();
      } catch {
        /* never started */
      }
      if (pilot) {
        const { oscillator, gain } = pilot;
        try {
          const now = ctx.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + PILOT_FADE_S);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
          oscillator.stop(now + PILOT_FADE_S + 0.01);
        } catch {
          /* the context is already gone, and the pilot with it */
        }
      }
    };
  }, [active, audioContext, inputTapRef]);

  return leakingRef;
}
