/// <reference lib="webworker" />
// Runs the note-onset model (noteOnsetModel.ts) off the main thread: ~180 ms a
// look on WASM, which the session's frame loop can't afford to wait for.

import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import type { GraphModel } from "@tensorflow/tfjs-converter";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import * as tf from "@tensorflow/tfjs-core";

import { onsetProbabilities } from "./noteOnsetInference";
import type { OnsetModelRequest, OnsetModelResponse } from "./noteOnsetModel";

let model: Promise<GraphModel> | null = null;

const load = async (modelUrl: string, wasmPath: string): Promise<GraphModel> => {
  setWasmPaths(wasmPath);
  await tf.setBackend("wasm");
  await tf.ready();
  return loadGraphModel(modelUrl);
};

self.onmessage = async (event: MessageEvent<OnsetModelRequest>) => {
  const { id, modelUrl, wasmPath, samples, sampleRate, queries } = event.data;
  let response: OnsetModelResponse;
  try {
    model ??= load(modelUrl, wasmPath);
    response = { id, probabilities: await onsetProbabilities(await model, samples, sampleRate, queries) };
  } catch (error) {
    // A model that failed to load stays failed — the main thread stops asking.
    response = { id, error: error instanceof Error ? error.message : String(error) };
  }
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(response);
};
