import type { OnsetQuery } from "utils/audio/noteOnsetModel";
import { midiOf, MODEL_SECONDS } from "utils/audio/noteOnsetModel";
import type { RecentAudioSnapshot } from "utils/audio/recentAudio";

import type { LearnTarget } from "../utils/learnSteps";
import { requiredChordTones } from "../utils/learnSteps";
import type { LearnFrame } from "./learnJudge";

/**
 * How sure the model has to be that a note started. Its own default is 0.5;
 * on synthetic let-ring strings the notes played scored 0.85–0.93, and a note a
 * fret below the one asked about, played while the one asked about still rang,
 * left that one at 0.44 — too near 0.5 to stand on.
 */
export const MODEL_ONSET_THRESHOLD = 0.7;
/** How long after an attack the model is asked: it needs some of the note to
 *  hear it start, and the last frames of a look are its least sure. */
const SETTLE_MS = 350;
/** The first frames of a look are as unsure as its last ones. */
const EDGE_SECONDS = 0.2;
/** A low-band attack is stamped at the end of its capture block — up to a
 *  window after the string was struck. */
const LOW_ATTACK_LEAD_MS = 20;

interface LearnModelCheckOptions {
  probe: (audio: RecentAudioSnapshot, queries: OnsetQuery[]) => Promise<number[] | null>;
  readAudio: () => RecentAudioSnapshot | null;
  /** The beat armed with `token` was heard — called at most once per token. */
  onHeard: (token: number) => void;
}

/** The newest attack in a frame, by either detector. */
const newestAttack = (f: LearnFrame): number =>
  Math.max(f.lastAttackMs ?? 0, (f.lastLowAttackMs ?? 0) > 0 ? (f.lastLowAttackMs ?? 0) - LOW_ATTACK_LEAD_MS : 0);

/**
 * A second way for learn mode to hear a beat: after each new attack the
 * note-onset model (noteOnsetModel.ts) is asked whether the beat's notes
 * started then. It hears what the pitch detector can't — a note picked under
 * strings still ringing, a string picked again while it rings — and it only
 * ever moves the lesson on; learnJudge goes on exactly as before beside it.
 */
export function createLearnModelCheck({ probe, readAudio, onHeard }: LearnModelCheckOptions) {
  let armedToken = -1;
  /** Attacks up to this one belong to beats before. */
  let spent = 0;
  /** The attack last put to the model, so each is asked about once. */
  let asked = 0;
  let busy = false;

  return {
    /** A new beat is being waited on: attacks heard so far are not its own. */
    arm(token: number, f: LearnFrame) {
      armedToken = token;
      spent = newestAttack(f);
      asked = 0;
    },
    /** Feeds one frame; asks the model when a new attack has had time to sound. */
    observe(token: number, targets: readonly LearnTarget[], f: LearnFrame) {
      if (token !== armedToken || busy) return;
      const attackMs = newestAttack(f);
      if (attackMs <= spent || attackMs === asked || f.now < attackMs + SETTLE_MS) return;
      // Picked notes at their written pitch only: a bend or a slide starts
      // somewhere else, a hammer-on has no attack of its own.
      if (targets.length === 0 || !targets.every((target) => target.readsAttack && target.freq > 0)) return;
      const audio = readAudio();
      if (!audio) return;
      asked = attackMs;
      const secondsBeforeEnd = (audio.endMs - attackMs) / 1000;
      if (secondsBeforeEnd < EDGE_SECONDS || secondsBeforeEnd > MODEL_SECONDS - EDGE_SECONDS) return;
      busy = true;
      // Each note is asked about with the frets either side of it: it counts
      // only when the model is surer of it than of them — a wrong fret played
      // is the neighbour the model hears start.
      const queries = targets.flatMap((target) => {
        const midi = midiOf(target.freq);
        return [midi, midi - 1, midi + 1].map((m) => ({ midi: m, secondsBeforeEnd }));
      });
      void probe(audio, queries).then((probabilities) => {
        busy = false;
        if (!probabilities || token !== armedToken) return;
        let heard = 0;
        for (let i = 0; i < targets.length; i++) {
          const [p, below, above] = probabilities.slice(i * 3, i * 3 + 3);
          if (p >= MODEL_ONSET_THRESHOLD && p > below && p > above) heard++;
        }
        const needed = targets.length === 1 ? 1 : requiredChordTones(targets.length);
        if (heard >= needed) {
          armedToken = -1; // once per beat
          onHeard(token);
        }
      });
    },
  };
}
