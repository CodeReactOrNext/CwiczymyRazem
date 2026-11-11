// The guitar DSP off the main thread: what the worker runs, and how the main
// thread takes its readings back.
//
// aubio's detectors cost ~5.5 ms per analysis window on a fast desktop and
// several times that on a phone a few years old — and a window arrives every
// ~43 ms. On the main thread that left such a phone no time to draw a frame or
// run the matching loop between two windows. So the same processor
// (guitarBufferProcessor.ts — nothing about the detection changes) runs in a
// worker against plain objects standing in for the refs, and after each window
// the worker posts what they now hold; the main thread only copies it over.
//
// Both halves live here, away from the Worker plumbing (guitarDsp.worker.ts,
// guitarDspClient.ts), so they can be run against each other in a test.
import type { AttackReading } from "utils/audio/attackTones";

import type { DetectedNoteEvent, ProcessorTargets } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

/** What the processor can be told while it runs. */
export interface DspSettings {
  gain: number;
  bass: boolean;
  /** Someone is reading lastSoftAttackMsRef (a strumming exercise). */
  strum: boolean;
}

export type DspRequest =
  | ({ type: "init"; sampleRate: number } & DspSettings)
  | ({ type: "config" } & Partial<DspSettings>)
  | { type: "samples"; samples: Float32Array; timeMs: number };

/** The refs' values after a window. */
export interface DspReadings {
  frequency: number;
  volume: number;
  rawVolume: number;
  noiseFloor: number;
  confidence: number;
  lastOnsetTime: number;
  lastTickTime: number;
  lastAttackMs: number;
  lastLowAttackMs: number;
  lastSoftAttackMs: number;
  inputPeak: number;
  /** The processor's throttled "signal is flowing" call landed in this window. */
  active: boolean;
}

export interface DspReadingsMessage {
  type: "readings";
  readings: DspReadings;
  /** Note events committed since the last message, oldest first. */
  events: DetectedNoteEvent[];
  /** Attack spectra that came in for events sent earlier, by the event's onsetMs. */
  attacks: { onsetMs: number; attack: AttackReading }[];
}

export type DspResponse =
  | { type: "ready" }
  | { type: "failed"; message: string }
  | DspReadingsMessage;

/** The refs the worker's readings land in. */
export type DspTargets = Omit<ProcessorTargets, "inputTapRef"> & Required<Pick<ProcessorTargets, "noteEventsRef">>;

/** Same bound as the processor's own ring (EVENT_BUFFER_MAX). */
const EVENT_BUFFER_MAX = 64;

const box = <T,>(value: T) => ({ current: value });

/**
 * The worker's side: a processor of its own, and after every window the
 * readings to post. `aubio` is the loaded aubiojs module.
 */
export function createDspSession(aubio: unknown, sampleRate: number, initial: DspSettings) {
  const settings: DspSettings = { ...initial };
  const targets = {
    frequencyRef: box(0),
    volumeRef: box(0),
    rawVolumeRef: box(0),
    noiseFloorRef: box(0),
    confidenceRef: box(0),
    lastOnsetTimeRef: box(0),
    lastTickTimeRef: box(0),
    noteEventsRef: box<DetectedNoteEvent[]>([]),
    lastAttackMsRef: box(0),
    lastLowAttackMsRef: box(0),
    lastSoftAttackMsRef: box(0),
    inputPeakRef: box(0),
  };
  let active = false;
  const process = createGuitarBufferProcessor({
    detectors: createGuitarDetectors(aubio, sampleRate),
    targets,
    sampleRate,
    getGain: () => settings.gain,
    isBass: () => settings.bass,
    isStrumWanted: () => settings.strum,
    onActive: () => { active = true; },
  });
  // An event is posted once, when it is committed. Its attack spectra can come
  // in a few windows later, and are then posted on their own. Value: whether
  // the event's attack was settled when it was last posted.
  const posted = new WeakMap<DetectedNoteEvent, boolean>();

  return {
    configure(patch: Partial<DspSettings>) {
      Object.assign(settings, patch);
    },
    /** Runs one window; returns what to post back. */
    push(samples: Float32Array, timeMs: number): DspReadingsMessage {
      active = false;
      process(samples, timeMs);
      const events: DetectedNoteEvent[] = [];
      const attacks: DspReadingsMessage["attacks"] = [];
      for (const event of targets.noteEventsRef.current) {
        const settled = event.attack !== "reading";
        const wasSettled = posted.get(event);
        if (wasSettled === undefined) events.push(event);
        else if (!wasSettled && settled) attacks.push({ onsetMs: event.onsetMs, attack: event.attack ?? null });
        else continue;
        posted.set(event, settled);
      }
      return {
        type: "readings",
        readings: {
          frequency: targets.frequencyRef.current,
          volume: targets.volumeRef.current,
          rawVolume: targets.rawVolumeRef.current,
          noiseFloor: targets.noiseFloorRef.current,
          confidence: targets.confidenceRef.current,
          lastOnsetTime: targets.lastOnsetTimeRef.current,
          lastTickTime: targets.lastTickTimeRef.current,
          lastAttackMs: targets.lastAttackMsRef.current,
          lastLowAttackMs: targets.lastLowAttackMsRef.current,
          lastSoftAttackMs: targets.lastSoftAttackMsRef.current,
          inputPeak: targets.inputPeakRef.current,
          active,
        },
        events,
        attacks,
      };
    },
  };
}

/** The main thread's side: copies a worker message into the refs the app reads. */
export function applyDspReadings(targets: DspTargets, { readings, events, attacks }: DspReadingsMessage) {
  targets.frequencyRef.current = readings.frequency;
  targets.volumeRef.current = readings.volume;
  targets.rawVolumeRef.current = readings.rawVolume;
  targets.noiseFloorRef.current = readings.noiseFloor;
  targets.confidenceRef.current = readings.confidence;
  targets.lastOnsetTimeRef.current = readings.lastOnsetTime;
  targets.lastTickTimeRef.current = readings.lastTickTime;
  if (targets.lastAttackMsRef) targets.lastAttackMsRef.current = readings.lastAttackMs;
  if (targets.lastLowAttackMsRef) targets.lastLowAttackMsRef.current = readings.lastLowAttackMs;
  if (targets.lastSoftAttackMsRef) targets.lastSoftAttackMsRef.current = readings.lastSoftAttackMs;
  if (targets.inputPeakRef) targets.inputPeakRef.current = readings.inputPeak;

  const buffer = targets.noteEventsRef.current;
  if (events.length > 0) {
    buffer.push(...events);
    if (buffer.length > EVENT_BUFFER_MAX) buffer.splice(0, buffer.length - EVENT_BUFFER_MAX);
  }
  for (const { onsetMs, attack } of attacks) {
    // Set on the event already handed out: readers hold on to it by identity.
    const event = buffer.find((candidate) => candidate.onsetMs === onsetMs);
    if (event) event.attack = attack;
  }
}
