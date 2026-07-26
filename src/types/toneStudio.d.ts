// Injected by the Electron preload (electron/preload.js) as window.toneStudio.
// Local preset + cabinet-IR CRUD — config/storage, distinct from the live-stream
// control surface in nativeAudio.d.ts (window.nativeAmp).
import type { AmpParams } from "./nativeAudio";

export interface TonePreset {
  id: string;
  name: string;
  params: AmpParams;
  /** True for the hardcoded presets shipped in src/feature/toneStudio/data —
   *  those never reach window.toneStudio, this flag only exists so the UI can
   *  disable delete/overwrite for them once merged with user presets. */
  builtIn: boolean;
  createdAt: number;
}

export interface ImportedIR {
  id: string;
  name: string;
  /** Sample rate the file was decoded at (resampling happens on load, per-stream). */
  sampleRate: number;
  lengthSamples: number;
  originalLengthSamples: number;
  /** True if the imported file was longer than the real-time convolution tap cap
   *  and got truncated on import. */
  truncated: boolean;
  importedAt: number;
}

export interface ImportedNamModel {
  id: string;
  name: string;
  /** High-level model architecture as reported by the .nam file (e.g. "WaveNet"). */
  architecture: string;
  gearMake: string | null;
  gearModel: string | null;
  importedAt: number;
}

export interface ToneStudioApi {
  isAvailable: true;
  listPresets: () => Promise<TonePreset[]>;
  savePreset: (preset: TonePreset) => Promise<TonePreset>;
  deletePreset: (id: string) => Promise<void>;
  listIRs: () => Promise<ImportedIR[]>;
  deleteIR: (id: string) => Promise<void>;
  /** Opens a native "choose a .wav file" dialog. Resolves null if cancelled. */
  importIR: () => Promise<ImportedIR | null>;
  listNamModels: () => Promise<ImportedNamModel[]>;
  deleteNamModel: (id: string) => Promise<void>;
  /** Opens a native "choose a .nam file" dialog. Resolves null if cancelled. */
  importNamModel: () => Promise<ImportedNamModel | null>;
}

declare global {
  interface Window {
    toneStudio?: ToneStudioApi;
  }
}

export {};
