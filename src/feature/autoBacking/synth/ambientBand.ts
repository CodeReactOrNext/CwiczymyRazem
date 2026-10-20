import { getCachedNoiseBuffer } from "feature/exercisePlan/hooks/useTablatureAudio/audio.constants";
import type {
  TablatureNote,
  TabTrackType,
} from "feature/exercisePlan/types/exercise.types";

import { Envelope } from "./envelope";

/**
 * The generated backing's sound: a soft ambient-electronic band, synthesised
 * on the spot — a wide detuned-saw pad, a warm sub bass and an 808-flavoured
 * kit, glued the way electronic music is: the pad and bass duck under the
 * kick, the pad trails a tempo-synced ping-pong echo, and everything shares
 * one long, dark reverb. Nothing to download, and a synth that doesn't
 * pretend to be a drummer never sounds like a bad one.
 *
 * One per AudioContext. A track's notes go into the input `insert` built for
 * it; its sends hang off its fader through `attachSends`.
 */

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** 0–1 loudness a tab note asks for. */
export function velocityOf(note: TablatureNote): number {
  const base = note.dynamics ?? 0.8;
  return Math.min(
    1,
    base * (note.isAccented ? 1.15 : 1) * (note.isGhost ? 0.35 : 1),
  );
}

/**
 * A long, dark hall: stereo noise under a decaying envelope, softened by a
 * one-pole low-pass so the tail is warm rather than hissy. The convolver
 * normalises it, so its level doesn't depend on the length.
 */
function buildImpulse(
  ctx: BaseAudioContext,
  seconds: number,
  decay: number,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth = 0.55 * smooth + 0.45 * (Math.random() * 2 - 1);
      data[i] = smooth * (1 - i / length) ** decay;
    }
  }
  return impulse;
}

/** tanh soft clip: adds the harmonics that let a sine bass or kick be heard on small speakers. */
function saturationCurve(drive: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(1024) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

/**
 * The metallic part of a TR-808 cymbal: six square waves at inharmonic
 * ratios of a 40 Hz fundamental. Through a band-pass and a high-pass this is
 * what a hi-hat is made of — plain noise only ever sounds like hiss.
 */
const METAL_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];
const METAL_FUNDAMENTAL = 40;

interface Voice {
  envelope: Envelope;
  oscillators: OscillatorNode[];
  /** When the note starts fading. */
  end: number;
}

interface PadVoice extends Voice {
  key: number;
  peak: number;
}

const PAD_RELEASE = 1.8;
/**
 * A pad note struck again on the same pitch within this gap after the last
 * one ended is tied over: the arranger restrikes a held chord every bar,
 * and a pad that swells again each time would pump.
 */
const TIE_GAP = 0.25;
const PAD_PANS = [-0.3, 0.3, -0.12, 0.12];
const PAD_DETUNE = [-11, 0, 11];

/** How much of each instrument goes to the hall and to the echo. */
const SENDS: Partial<Record<TabTrackType, { reverb: number; echo: number }>> = {
  keys: { reverb: 0.5, echo: 0.28 },
  drums: { reverb: 0.16, echo: 0 },
  bass: { reverb: 0.03, echo: 0 },
  // The arpeggio is mostly echo: one pluck, then its repeats bouncing across.
  arp: { reverb: 0.35, echo: 0.5 },
};

/** The kick pushes the pad and bass down this far, then lets them back up. */
const DUCK_DEPTH = 0.55;

const stopAt = (oscillators: OscillatorNode[], when: number) => {
  for (const osc of oscillators) {
    try {
      osc.stop(when);
    } catch {
      /* already stopped */
    }
  }
};

export class AmbientBand {
  /**
   * Where every generated track ends up — the band's own bus, with a limiter
   * on it, so however many hits pile up (a boss in a rage, a crash on a kick
   * on a bass note) the band never clips over the guitar it backs.
   */
  readonly bus: AudioNode;
  private readonly reverbInput: GainNode;
  private readonly echoInput: GainNode;
  private readonly echoLeft: DelayNode;
  private readonly echoRight: DelayNode;
  private readonly pads = new Map<string, PadVoice>();
  private readonly basses = new Map<string, Voice>();
  private readonly openHats = new Map<string, Envelope>();
  /** The sidechain ducker of each pad/bass chain, by the chain's input. */
  private readonly ducks = new Map<AudioNode, Envelope>();
  private readonly lfoDepth: GainNode;
  private readonly kickCurve = saturationCurve(1.6);
  private readonly bassCurve = saturationCurve(1.2);
  /** A boss in a rage: the band plays harder on the fly (see setRage). */
  private rage = false;

  constructor(
    private readonly ctx: BaseAudioContext,
    output: AudioNode,
  ) {
    // ── Bus: trim, then a limiter. The compressor adds its own make-up gain
    // (about +3.4 dB at these settings); the trim takes it back off, so the
    // band only changes where a peak would have gone over. ──
    const trim = ctx.createGain();
    trim.gain.value = 0.66;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    trim.connect(limiter);
    limiter.connect(output);
    this.bus = trim;

    // ── Hall ──
    this.reverbInput = ctx.createGain();
    const preDelay = ctx.createDelay(0.1);
    preDelay.delayTime.value = 0.025;
    const convolver = ctx.createConvolver();
    convolver.buffer = buildImpulse(ctx, 3.4, 2.6);
    const wet = ctx.createGain();
    // The whole band sits a few dB under full scale: the tab's guitar plays on top.
    wet.gain.value = 0.75;
    // A reverb tail with lows in it is mud: the hall keeps only the middle.
    const hallLow = ctx.createBiquadFilter();
    hallLow.type = "highpass";
    hallLow.frequency.value = 240;
    const hallHigh = ctx.createBiquadFilter();
    hallHigh.type = "lowpass";
    hallHigh.frequency.value = 8000;
    this.reverbInput.connect(preDelay);
    preDelay.connect(convolver);
    convolver.connect(hallLow);
    hallLow.connect(hallHigh);
    hallHigh.connect(wet);
    wet.connect(this.bus);

    // ── Ping-pong echo, darkened on every repeat ──
    this.echoInput = ctx.createGain();
    this.echoLeft = ctx.createDelay(1.5);
    this.echoRight = ctx.createDelay(1.5);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    const thin = ctx.createBiquadFilter();
    thin.type = "highpass";
    thin.frequency.value = 280;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const left = ctx.createStereoPanner();
    left.pan.value = -0.7;
    const right = ctx.createStereoPanner();
    right.pan.value = 0.7;
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.7;
    this.echoInput.connect(thin);
    thin.connect(tone);
    tone.connect(this.echoLeft);
    this.echoLeft.connect(left);
    this.echoLeft.connect(this.echoRight);
    this.echoRight.connect(right);
    this.echoRight.connect(feedback);
    feedback.connect(thin);
    left.connect(echoOut);
    right.connect(echoOut);
    echoOut.connect(this.bus);
    // The repeats wash into the hall too.
    echoOut.connect(this.reverbInput);
    this.setTempo(90);

    // One slow sweep shared by every pad voice's filter: the pad breathes.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = 450;
    lfo.connect(this.lfoDepth);
    lfo.start();
  }

  /** Dotted-eighth echo at the session tempo — an eighth when that would be too long. */
  /**
   * The boss has enraged — play the rest of the phase harder without
   * rewriting a note: a double kick under every hi-hat, a tom under every
   * snare, louder crashes and wider-open filters on everything pitched.
   * Takes effect from the next note scheduled.
   */
  setRage(on: boolean) {
    this.rage = on;
  }

  setTempo(bpm: number) {
    const beat = 60 / Math.max(30, bpm);
    const time = beat * 0.75 <= 1.2 ? beat * 0.75 : beat * 0.5;
    this.echoLeft.delayTime.value = time;
    this.echoRight.delayTime.value = time;
  }

  // ── Track chains ─────────────────────────────────────────────────────────

  /**
   * The chain a generated track's notes go into before its fader: the pad
   * through a ducker and a stereo chorus, the bass through a ducker and a
   * warm saturator, everything into a compressor that evens the hits out and
   * keeps a hard one from clipping. Returns the node to play into.
   */
  insert(trackType: TabTrackType | undefined, fader: AudioNode): AudioNode {
    const ctx = this.ctx;
    const compressor = ctx.createDynamicsCompressor();
    const settings =
      trackType === "drums"
        ? { threshold: -14, knee: 6, ratio: 4, attack: 0.004, release: 0.15 }
        : trackType === "bass"
          ? { threshold: -20, knee: 6, ratio: 3, attack: 0.01, release: 0.2 }
          : {
              threshold: -20,
              knee: 10,
              ratio: 2.5,
              attack: 0.01,
              release: 0.25,
            };
    compressor.threshold.value = settings.threshold;
    compressor.knee.value = settings.knee;
    compressor.ratio.value = settings.ratio;
    compressor.attack.value = settings.attack;
    compressor.release.value = settings.release;
    if (trackType === "drums") {
      // The compressor's own make-up gain lifts the kit; in an ambient mix
      // it sits a little back.
      const trim = ctx.createGain();
      trim.gain.value = 0.75;
      compressor.connect(trim);
      trim.connect(fader);
      return compressor;
    }
    compressor.connect(fader);

    const duck = ctx.createGain();
    const duckEnvelope = new Envelope(duck.gain);
    duckEnvelope.set(1, 0);
    this.ducks.set(duck, duckEnvelope);

    if (trackType === "bass") {
      // Driven into the saturator hard enough to grow harmonics — a quiet
      // signal passes a tanh almost untouched — then brought back down.
      const drive = ctx.createGain();
      drive.gain.value = 3;
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.bassCurve;
      shaper.oversample = "2x";
      const trim = ctx.createGain();
      trim.gain.value = 0.34;
      const rumble = ctx.createBiquadFilter();
      rumble.type = "highpass";
      rumble.frequency.value = 35;
      duck.connect(drive);
      drive.connect(shaper);
      shaper.connect(trim);
      trim.connect(rumble);
      rumble.connect(compressor);
      return duck;
    }

    if (trackType === "arp") {
      const clearArp = ctx.createBiquadFilter();
      clearArp.type = "highpass";
      clearArp.frequency.value = 280;
      duck.connect(clearArp);
      clearArp.connect(compressor);
      return duck;
    }

    // The pad leaves the low end to the bass and adds a little air.
    const clear = ctx.createBiquadFilter();
    clear.type = "highpass";
    clear.frequency.value = 200;
    clear.Q.value = 0.7;
    const air = ctx.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 5000;
    air.gain.value = 4;
    duck.connect(clear);
    clear.connect(air);
    air.connect(compressor);
    air.connect(this.chorus(compressor));
    return duck;
  }

  /** A track's chain is gone: its ducker no longer follows the kick. */
  removeInsert(input: AudioNode) {
    this.ducks.delete(input);
  }

  /** Two slowly wobbling short delays panned apart — width from a mono voice. */
  private chorus(into: AudioNode): AudioNode {
    const ctx = this.ctx;
    const input = ctx.createGain();
    for (const [base, rate, pan] of [
      [0.012, 0.23, -0.8],
      [0.017, 0.31, 0.8],
    ] as const) {
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = base;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = rate;
      const depth = ctx.createGain();
      depth.gain.value = 0.0025;
      lfo.connect(depth);
      depth.connect(delay.delayTime);
      lfo.start();
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      const level = ctx.createGain();
      level.gain.value = 0.5;
      input.connect(delay);
      delay.connect(panner);
      panner.connect(level);
      level.connect(into);
    }
    return input;
  }

  /** The hall and echo sends of a track, taken after its fader. */
  attachSends(
    trackType: TabTrackType | undefined,
    fader: AudioNode,
  ): AudioNode[] {
    const amounts = SENDS[trackType ?? "guitar"];
    if (!amounts) return [];
    const nodes: AudioNode[] = [];
    for (const [amount, target] of [
      [amounts.reverb, this.reverbInput],
      [amounts.echo, this.echoInput],
    ] as const) {
      if (amount <= 0) continue;
      const send = this.ctx.createGain();
      send.gain.value = amount;
      fader.connect(send);
      send.connect(target);
      nodes.push(send);
    }
    return nodes;
  }

  private oscillator(
    type: OscillatorType,
    frequency: number,
    cents: number,
    level: number,
    into: AudioNode,
  ) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = cents;
    const gain = this.ctx.createGain();
    gain.gain.value = level;
    osc.connect(gain);
    gain.connect(into);
    osc.onended = () => gain.disconnect();
    return osc;
  }

  // ── Pad ──────────────────────────────────────────────────────────────────

  /** A chord tone in `slot` (one per keyboard voice), sounding for `duration` seconds. */
  playPad(
    slot: string,
    voiceIndex: number,
    key: number,
    velocity: number,
    time: number,
    duration: number,
    destination: AudioNode,
  ) {
    const previous = this.pads.get(slot);
    if (previous && previous.key === key && time <= previous.end + TIE_GAP) {
      // Tied over: back up to full if the fade had begun in the gap, hold on.
      previous.envelope.glideTo(
        previous.peak,
        Math.max(time, this.ctx.currentTime),
        0.06,
      );
      this.fade(previous, time + duration, PAD_RELEASE);
      return;
    }
    // A chord change: the old tone fades under the new one's swell.
    if (previous) this.fade(previous, time, 0.8);

    const ctx = this.ctx;
    const peak = 0.085 * (0.65 + 0.35 * velocity);
    const attack = Math.min(0.45, Math.max(0.04, duration * 0.3));
    const gain = ctx.createGain();
    const envelope = new Envelope(gain.gain);
    envelope.set(0, time);
    envelope.rampTo(peak, time + attack);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500 + 1000 * velocity + (this.rage ? 900 : 0);
    filter.Q.value = 0.9;
    this.lfoDepth.connect(filter.frequency);

    const panner = ctx.createStereoPanner();
    panner.pan.value = PAD_PANS[voiceIndex % PAD_PANS.length];

    const frequency = midiToHz(key);
    const oscillators = [
      ...PAD_DETUNE.map((cents) =>
        this.oscillator("sawtooth", frequency, cents, 0.3, filter),
      ),
      // An octave below, soft: body without mud.
      this.oscillator("triangle", frequency / 2, 0, 0.32, filter),
    ];
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
    for (const osc of oscillators) osc.start(time);
    oscillators[0].addEventListener("ended", () => {
      this.lfoDepth.disconnect(filter.frequency);
      filter.disconnect();
      gain.disconnect();
      panner.disconnect();
    });

    const voice: PadVoice = { key, peak, envelope, oscillators, end: time };
    this.fade(voice, time + duration, PAD_RELEASE);
    this.pads.set(slot, voice);
  }

  /** Fade a voice out from `at`, over `release` seconds, and stop it after. */
  private fade(voice: Voice, at: number, release: number) {
    const when = Math.max(at, this.ctx.currentTime);
    voice.envelope.fadeOut(when, release / 4);
    voice.end = when;
    stopAt(voice.oscillators, when + release + 0.2);
  }

  // ── Arpeggio ─────────────────────────────────────────────────────────────

  /**
   * One pluck of the arpeggio: two detuned oscillators through a filter that
   * snaps shut, alternating sides note by note (`side` 1 = left).
   */
  playArp(
    key: number,
    velocity: number,
    time: number,
    duration: number,
    destination: AudioNode,
    side: number,
  ) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    const envelope = new Envelope(gain.gain);
    envelope.set(0, time);
    envelope.rampTo(0.07 * (0.5 + 0.5 * velocity), time + 0.004);
    envelope.approach(0, time + 0.004, Math.min(0.1, duration / 3));

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(
      3200 + 1500 * velocity + (this.rage ? 1500 : 0),
      time,
    );
    filter.frequency.setTargetAtTime(700, time, 0.08);

    const panner = ctx.createStereoPanner();
    panner.pan.value = side === 1 ? -0.35 : 0.35;

    const frequency = midiToHz(key);
    const oscillators = [
      this.oscillator("square", frequency, -6, 0.35, filter),
      this.oscillator("sawtooth", frequency, 6, 0.35, filter),
    ];
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
    for (const osc of oscillators) osc.start(time);
    stopAt(oscillators, time + 0.8);
    oscillators[0].addEventListener("ended", () => {
      filter.disconnect();
      gain.disconnect();
      panner.disconnect();
    });
  }

  // ── Bass ─────────────────────────────────────────────────────────────────

  /** A warm sub bass, one note at a time per slot — a new note takes over. */
  playBass(
    slot: string,
    key: number,
    velocity: number,
    time: number,
    duration: number,
    destination: AudioNode,
  ) {
    const previous = this.basses.get(slot);
    if (previous) this.fade(previous, time, 0.04);

    const ctx = this.ctx;
    const peak = 0.2 * (0.6 + 0.4 * velocity);
    const gain = ctx.createGain();
    const envelope = new Envelope(gain.gain);
    envelope.set(0, time);
    envelope.rampTo(peak, time + 0.008);
    envelope.approach(peak * 0.75, time + 0.008, 0.12);

    // A little bite on the attack that closes back down: the note speaks,
    // then sits under the guitar.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(
      1100 + 600 * velocity + (this.rage ? 500 : 0),
      time,
    );
    filter.frequency.setTargetAtTime(520 + 260 * velocity, time, 0.07);

    const frequency = midiToHz(key);
    const oscillators = [
      this.oscillator("sine", frequency, 0, 0.7, filter),
      // The saw's harmonics are what small speakers play of a bass line.
      this.oscillator("sawtooth", frequency, 4, 0.3, filter),
    ];
    filter.connect(gain);
    gain.connect(destination);
    for (const osc of oscillators) osc.start(time);
    oscillators[0].addEventListener("ended", () => {
      filter.disconnect();
      gain.disconnect();
    });

    const voice: Voice = { envelope, oscillators, end: time };
    this.fade(voice, time + duration, 0.14);
    this.basses.set(slot, voice);
  }

  // ── Drums ────────────────────────────────────────────────────────────────

  /** An 808-flavoured kit, on the General MIDI notes the arranger writes. */
  playDrum(
    trackId: string,
    note: TablatureNote,
    time: number,
    destination: AudioNode,
  ) {
    const v = velocityOf(note);
    switch (note.midiNote) {
      case 35:
      case 36:
        this.kick(time, v, destination);
        break;
      case 37:
        this.rim(time, v, destination);
        break;
      case 38:
      case 39:
      case 40:
        this.snare(time, v, destination);
        if (this.rage) this.tom(time, v * 0.8, destination, 105);
        break;
      case 42:
      case 44:
        if (this.rage) this.kick(time, v * 0.45, destination, false);
        this.chokeHat(trackId, time);
        this.metal(
          time,
          v,
          destination,
          note.midiNote === 44 ? 0.03 : 0.05,
          0.17,
        );
        break;
      case 46:
        this.chokeHat(trackId, time);
        this.openHats.set(trackId, this.metal(time, v, destination, 0.3, 0.12));
        break;
      case 51:
      case 53:
      case 59:
        this.metal(time, v, destination, 0.55, 0.065, 8000);
        break;
      case 49:
      case 52:
      case 55:
      case 57:
        this.wash(time, v, destination);
        break;
      case 41:
      case 43:
      case 45:
        this.tom(time, v, destination, 105);
        break;
      case 47:
      case 48:
      case 50:
        this.tom(time, v, destination, 155);
        break;
      default:
        break;
    }
  }

  /** A struck sound: up in `attack`, then an exponential decay. */
  private hit(
    time: number,
    peak: number,
    decay: number,
    destination: AudioNode,
    attack = 0.002,
  ) {
    const gain = this.ctx.createGain();
    const envelope = new Envelope(gain.gain);
    envelope.set(0, time);
    envelope.rampTo(peak, time + attack);
    envelope.approach(0, time + attack, decay / 4);
    gain.connect(destination);
    return { gain, envelope };
  }

  private noise(
    time: number,
    seconds: number,
    into: AudioNode,
    cleanup: () => void,
  ) {
    const source = this.ctx.createBufferSource();
    source.buffer = getCachedNoiseBuffer(
      this.ctx as AudioContext,
      Math.ceil(seconds * 1000),
    );
    source.connect(into);
    source.onended = cleanup;
    source.start(time);
    source.stop(time + seconds);
  }

  /** A soft 808-style kick with a short click on the front, saturated so it carries. */
  /** `duck` off for the doubled kicks of a rage — the pad shouldn't pump on every sixteenth. */
  private kick(time: number, v: number, destination: AudioNode, duck = true) {
    const ctx = this.ctx;
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.kickCurve;
    shaper.connect(destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.06);
    const { gain } = this.hit(time, 0.4 * (0.5 + 0.5 * v), 0.28, shaper, 0.002);
    osc.connect(gain);
    osc.onended = () => {
      gain.disconnect();
      shaper.disconnect();
    };
    osc.start(time);
    osc.stop(time + 0.6);

    const click = ctx.createBiquadFilter();
    click.type = "highpass";
    click.frequency.value = 2500;
    const { gain: clickGain } = this.hit(time, 0.24 * v, 0.012, shaper, 0.0005);
    click.connect(clickGain);
    this.noise(time, 0.02, click, () => {
      click.disconnect();
      clickGain.disconnect();
    });

    // The pad and bass make room for it — the pulse electronic music breathes with.
    if (!duck) return;
    for (const ducker of this.ducks.values()) {
      ducker.forget(time - 1);
      ducker.moveTo(1 - (1 - DUCK_DEPTH) * (0.6 + 0.4 * v), time, 0.006);
      ducker.moveTo(1, time + 0.05, 0.09);
    }
  }

  /** Clap, body and tail: an electronic snare that still has a pitch. */
  private snare(time: number, v: number, destination: AudioNode) {
    const ctx = this.ctx;
    const level = 0.3 * (0.4 + 0.6 * v);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1700;
    band.Q.value = 0.8;
    const clapGain = ctx.createGain();
    const clap = new Envelope(clapGain.gain);
    clap.set(0, time);
    for (const offset of [0, 0.01, 0.02]) {
      clap.set(level, time + offset);
      clap.approach(level * 0.15, time + offset, 0.003);
    }
    clap.set(level * 0.75, time + 0.028);
    clap.approach(0, time + 0.028, 0.06);
    band.connect(clapGain);
    clapGain.connect(destination);
    this.noise(time, 0.4, band, () => {
      band.disconnect();
      clapGain.disconnect();
    });

    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(210, time);
    body.frequency.exponentialRampToValueAtTime(165, time + 0.06);
    const { gain: bodyGain } = this.hit(
      time,
      0.32 * (0.4 + 0.6 * v),
      0.1,
      destination,
      0.001,
    );
    body.connect(bodyGain);
    body.onended = () => bodyGain.disconnect();
    body.start(time);
    body.stop(time + 0.2);
  }

  private rim(time: number, v: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 820;
    const { gain } = this.hit(
      time,
      0.2 * (0.5 + 0.5 * v),
      0.04,
      destination,
      0.001,
    );
    osc.connect(gain);
    osc.onended = () => gain.disconnect();
    osc.start(time);
    osc.stop(time + 0.1);
  }

  /** Hi-hat / ride: the 808's six detuned squares, band-passed, high-passed, enveloped. */
  private metal(
    time: number,
    v: number,
    destination: AudioNode,
    decay: number,
    level: number,
    band = 10000,
  ) {
    const ctx = this.ctx;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = band;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7000;
    const { gain, envelope } = this.hit(
      time,
      level * (0.35 + 0.65 * v),
      decay,
      destination,
      0.001,
    );
    bandpass.connect(highpass);
    highpass.connect(gain);
    const oscillators = METAL_RATIOS.map((ratio) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = METAL_FUNDAMENTAL * ratio;
      osc.connect(bandpass);
      osc.start(time);
      osc.stop(time + decay + 0.1);
      return osc;
    });
    oscillators[0].onended = () => {
      bandpass.disconnect();
      highpass.disconnect();
      gain.disconnect();
    };
    return envelope;
  }

  private chokeHat(trackId: string, time: number) {
    const open = this.openHats.get(trackId);
    if (!open) return;
    open.fadeOut(time, 0.01);
    this.openHats.delete(trackId);
  }

  /** Where a crash would be: a soft swell of metal and noise into the reverb. */
  private wash(time: number, v: number, destination: AudioNode) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3200;
    const { gain } = this.hit(
      time,
      0.08 * (0.5 + 0.5 * v) * (this.rage ? 1.6 : 1),
      1.8,
      destination,
      0.03,
    );
    filter.connect(gain);
    this.noise(time, 2.2, filter, () => {
      filter.disconnect();
      gain.disconnect();
    });
    this.metal(time, v, destination, 1.2, 0.03, 7000);
  }

  private tom(time: number, v: number, destination: AudioNode, pitch: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch * 1.6, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.08);
    const { gain } = this.hit(
      time,
      0.45 * (0.5 + 0.5 * v),
      0.32,
      destination,
      0.002,
    );
    osc.connect(gain);
    osc.onended = () => gain.disconnect();
    osc.start(time);
    osc.stop(time + 0.5);
  }

  // ── Transport ────────────────────────────────────────────────────────────

  /** Playback stopped: let the pads and bass fade out quickly. */
  stopAll() {
    const now = this.ctx.currentTime;
    for (const voice of this.pads.values()) this.fade(voice, now, 0.3);
    for (const voice of this.basses.values()) this.fade(voice, now, 0.08);
    for (const hat of this.openHats.values()) hat.fadeOut(now, 0.01);
    for (const duck of this.ducks.values()) duck.moveTo(1, now, 0.02);
    this.pads.clear();
    this.basses.clear();
    this.openHats.clear();
  }
}
