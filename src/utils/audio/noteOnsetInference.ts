// The note-onset model's one look (noteOnsetModel.ts) — kept apart because it
// needs TensorFlow, which only the worker (and the tests) may load.

import type { GraphModel } from "@tensorflow/tfjs-converter";
import * as tf from "@tensorflow/tfjs-core";

import type { OnsetQuery } from "./noteOnsetModel";
import { frameOf, lastLook, MODEL_RATE, MODEL_SAMPLES, MODEL_SECONDS, onsetAround, resample } from "./noteOnsetModel";

/** The onset head of the graph (the note and contour heads aren't read). */
const ONSETS_OUTPUT = "Identity_2:0";

/**
 * How likely each queried note started when asked, read off the end of
 * `samples` (any sample rate; only its last ~2 s are looked at).
 */
export async function onsetProbabilities(
  model: GraphModel,
  samples: Float32Array,
  sampleRate: number,
  queries: readonly OnsetQuery[],
): Promise<number[]> {
  // Only as much as the look needs is resampled, plus the filter's reach.
  const needed = Math.ceil(MODEL_SECONDS * sampleRate) + 64;
  const tail = samples.subarray(Math.max(0, samples.length - needed));
  const look = lastLook(resample(tail, sampleRate, MODEL_RATE));
  const input = tf.tensor3d(look, [1, MODEL_SAMPLES, 1]);
  const output = model.execute(input, ONSETS_OUTPUT) as tf.Tensor;
  const onsets = (await output.data()) as Float32Array;
  tf.dispose([input, output]);
  return queries.map(({ midi, secondsBeforeEnd }) => onsetAround(onsets, midi, frameOf(secondsBeforeEnd)));
}
