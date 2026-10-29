import { useAutoBackingStore } from "feature/autoBacking/store/autoBackingStore";
import { activeBand } from "feature/autoBacking/synth/activeBand";
import type { AmbientBand, BandAccent } from "feature/autoBacking/synth/ambientBand";
import { FULL_ENERGY } from "feature/autoBacking/synth/ambientBand";
import type { SessionAudioClock } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

import type { BossCue } from "./bossCues";
import { scheduleCue } from "./bossCues";
import type { CueEvent } from "./cueEvents";
import { beatPosition, beatTime, countdownBeats, nextGridTime, nextQuakeStart } from "./cueTiming";

/** Where the cues sit under the master volume — under the metronome. */
const CUES_LEVEL = 0.8;
/** How far ahead a cue is scheduled at the least, so it isn't late. */
const LEAD_SEC = 0.02;
/** A bite muffles the band for this much of a beat. */
const HURT_BEATS = 0.75;
/** A strike lands on the next eighth — on the music, never more than half a beat late. */
const STRIKE_GRID = 2;
/** After a strike the band plays everything for a bar. */
const BOOST_BEATS = 4;
/** A strike's time this long gone belongs to a run before this one, seconds. */
const STALE_STRIKE_SEC = 2;

/** The fight's hits the band plays as its own. */
const BAND_ACCENTS: Partial<Record<BossCue, BandAccent>> = {
  strike: "strike",
  impact: "impact",
  block: "block",
  bank: "crash",
};

let clock: SessionAudioClock | null = null;
let output: GainNode | null = null;
let enabled = true;

/** What the band should be playing for the run, whatever band there is to tell. */
const music = { level: 1, tension: 0, danger: false };
/** When the last strike lands, and until when its boost runs (audio time). */
let strikeAt = 0;
let boostUntil = 0;
/** Where each strike lands, by its tick — the arena times its slash by it. */
const strikeTimes = new Map<number, number>();
/** The band (and the run) the music was last handed to. */
let tuned: { band: AmbientBand; startTime: number } | null = null;

const outputFor = (current: SessionAudioClock) => {
  if (!output || output.context !== current.context) {
    output?.disconnect();
    output = current.context.createGain();
    output.connect(current.context.destination);
  }
  output.gain.value = CUES_LEVEL * current.volume;
  return output;
};

const at = (cue: BossCue, time: number, step = 0) => {
  if (!clock) return;
  scheduleCue(clock.context, outputFor(clock), cue, Math.max(time, clock.context.currentTime + LEAD_SEC), step);
};

/**
 * The backing's band, when it plays on the session's clock: the fight's hits
 * then become part of the music — on its grid, through its bus. Without a
 * backing the cues play on their own.
 */
const bandFor = (current: SessionAudioClock): AmbientBand | null => {
  const band = activeBand();
  const backing = useAutoBackingStore.getState();
  return band && band.context === current.context && backing.enabled && backing.available ? band : null;
};

/** A new band, or a run started over: hand it the music the fight is at. */
const tune = () => {
  if (!clock || clock.startTime === null) return;
  const band = bandFor(clock);
  if (!band || (tuned?.band === band && tuned.startTime === clock.startTime)) return;
  tuned = { band, startTime: clock.startTime };
  const now = clock.context.currentTime;
  band.setEnergy(music.level, now);
  band.setDanger(music.danger);
  band.setTension(music.tension, now);
};

/** Where strike `tick` lands: the next eighth of the run, worked out once. */
const strikeTimeFor = (tick: number): number | null => {
  // A strike is waited on for half a beat at most: a time long gone is an old
  // run's, whose ticks a new run counts again from 0.
  const cached = strikeTimes.get(tick);
  if (cached !== undefined && (!clock || cached > clock.context.currentTime - STALE_STRIKE_SEC)) return cached;
  if (!clock || clock.startTime === null || clock.context.state !== "running") return null;
  const time = nextGridTime(clock.context.currentTime + LEAD_SEC, clock.startTime, clock.bpm, STRIKE_GRID);
  strikeTimes.set(tick, time);
  // Only the last few can still be waited on.
  for (const key of strikeTimes.keys()) if (key < tick - 4) strikeTimes.delete(key);
  return time;
};

/**
 * Plays the fight on the session's own clock. With the backing on, the band
 * plays along with the run: more of the score the longer the streak, the
 * groove gone at a miss, its pad opening up as the sword fills, a heartbeat
 * when the player is low, every strike its biggest hit on the next eighth and
 * a bar of everything after it — slams, blocks and countdowns its own drums.
 * Without it, short cues: a strike on the next eighth, a countdown on the
 * beats the metronome clicks on. One player for the session — the desktop and
 * phone views are both mounted, the overlay that drives it only once.
 */
export const bossCuePlayer = {
  /** The session hands its clock over whenever it changes; null when it goes. */
  setClock(next: SessionAudioClock | null) {
    clock = next;
    if (!next) {
      output?.disconnect();
      output = null;
      // Whatever plays next is an ordinary backing again.
      activeBand()?.resetLive();
      tuned = null;
      strikeTimes.clear();
      return;
    }
    if (output) outputFor(next);
    tune();
  },

  setEnabled(on: boolean) {
    enabled = on;
  },

  /** How long the arena holds strike `tick`'s slash so it lands with the music; 0 without a running clock. */
  strikeDelayMs(tick: number) {
    if (!enabled || !clock) return 0;
    const time = strikeTimeFor(tick);
    return time === null ? 0 : Math.max(0, (time - clock.context.currentTime) * 1000);
  },

  play(event: CueEvent) {
    // The music follows the run whether or not there is a band to tell.
    if (event.kind === "energy") music.level = event.level;
    if (event.kind === "tension") music.tension = event.amount;
    if (event.kind === "danger") music.danger = event.on;
    if (!clock || clock.context.state !== "running") return;
    tune();
    const now = clock.context.currentTime + LEAD_SEC;
    const { startTime, bpm } = clock;
    const band = startTime === null ? null : bandFor(clock);
    const beat = 60 / bpm;

    switch (event.kind) {
      case "energy":
        if (!band || startTime === null) return;
        if (event.drop) {
          // A miss: the groove goes on the next eighth, and any boost with it.
          boostUntil = 0;
          band.setEnergy(event.level, nextGridTime(now, startTime, bpm, event.everyBeats ? 1 / event.everyBeats : 2));
        } else {
          const rise = nextGridTime(now, startTime, bpm, event.everyBeats ? 1 / event.everyBeats : 1);
          band.setEnergy(event.level, Math.max(rise, boostUntil));
        }
        return;
      case "tension":
        // Emptied by a strike: the pad closes as it lands, not before.
        band?.setTension(event.amount, event.amount === 0 && strikeAt > now ? strikeAt : now);
        return;
      case "danger":
        band?.setDanger(event.on);
        return;
      default:
        break;
    }
    if (!enabled) return;

    if (event.kind === "now") {
      if (event.cue === "strike" && event.tick !== undefined && startTime !== null) {
        const time = strikeTimeFor(event.tick) ?? now;
        strikeAt = time;
        if (band) {
          band.accent("strike", time);
          band.setEnergy(FULL_ENERGY, time);
          boostUntil = time + BOOST_BEATS * beat;
          band.setEnergy(music.level, boostUntil);
        } else {
          at("strike", time);
        }
        return;
      }
      const accent = BAND_ACCENTS[event.cue];
      if (band && startTime !== null && (accent || event.cue === "hurt")) {
        const time = nextGridTime(now, startTime, bpm);
        if (accent) band.accent(accent, time);
        else band.dip(time, beat * HURT_BEATS);
        return;
      }
      at(event.cue, now);
      return;
    }
    if (startTime === null) return;
    const position = beatPosition(now, startTime, bpm);
    const time = (b: number) => beatTime(b, startTime, bpm);

    if (event.kind === "slamCountdown") {
      const attack = position + event.beatsAway;
      const beats = countdownBeats(position, attack);
      if (band) {
        // The slam lands as a strike, block or impact of its own.
        if (beats.length) band.roll(time(beats[0]), time(attack), beat);
        return;
      }
      beats.forEach((b, i) => at(i === beats.length - 1 ? "tickLast" : "tick", time(b), i));
      return;
    }

    const start = nextQuakeStart(position, event.starts, event.passBeats);
    if (start === null) return;
    const beats = countdownBeats(position, start);
    if (band) {
      if (beats.length) band.roll(time(beats[0]), time(start), beat);
      band.accent("crash", time(start));
      return;
    }
    beats.forEach((b, i) => at("tick", time(b), i));
    at("tickLast", time(start));
  },
};
