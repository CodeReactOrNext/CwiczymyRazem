import type { TonePreset } from "types/toneStudio";

// Hardcoded — never round-trips through window.toneStudio, so it can't be corrupted
// or deleted. useTonePresets merges these with the user's saved presets at read time.
//
// `drive` values below are deliberately kept under ~0.47: ampSim.js feeds
// tanh(x * (1 + drive*30)) and tanh saturates to >99% of full output by
// drive≈0.47 (pre-gain ×15) — pushing a preset's drive past that only burns
// headroom before the makeup-gain `level`, it doesn't add audible edge. All the
// perceptible clean→crunch→lead separation has to happen below that ceiling.
//
// `preampGain` feeds an earlier, gentler tanh stage (pre-gain ×9 max) ahead of
// the tone stack — the second, cascaded gain stage a real amp's preamp section
// has before the power amp. It's kept low on the clean presets: the two stages
// compound, so a hot preamp reads as dirty even with `drive` near zero.
export const BUILT_IN_PRESETS: TonePreset[] = [
  {
    id: "builtin-clean-bright",
    name: "Clean Bright",
    builtIn: true,
    createdAt: 0,
    params: {
      preampGain: 0.1, drive: 0.05, bass: 0.5, mid: 0.45, treble: 0.62, level: 0.68, cab: true, gate: true,
      overdriveEnabled: false, overdriveDrive: 0.35, overdriveTone: 0.5, overdriveLevel: 0.5,
      delayEnabled: false, delayMs: 250, delayFeedback: 0.5, delayMix: 0.12,
      irId: null, namEnabled: false, namModelId: null,
    },
  },
  {
    id: "builtin-crunch-rock",
    name: "Crunch Rock",
    builtIn: true,
    createdAt: 0,
    params: {
      preampGain: 0.25, drive: 0.18, bass: 0.55, mid: 0.6, treble: 0.55, level: 0.62, cab: true, gate: true,
      overdriveEnabled: false, overdriveDrive: 0.35, overdriveTone: 0.5, overdriveLevel: 0.5,
      delayEnabled: false, delayMs: 200, delayFeedback: 0.55, delayMix: 0.08,
      irId: null, namEnabled: false, namModelId: null,
    },
  },
  {
    id: "builtin-high-gain-lead",
    name: "High Gain Lead",
    builtIn: true,
    createdAt: 0,
    params: {
      preampGain: 0.55, drive: 0.42, bass: 0.48, mid: 0.68, treble: 0.52, level: 0.55, cab: true, gate: true,
      overdriveEnabled: false, overdriveDrive: 0.35, overdriveTone: 0.5, overdriveLevel: 0.5,
      delayEnabled: true, delayMs: 380, delayFeedback: 0.28, delayMix: 0.22,
      irId: null, namEnabled: false, namModelId: null,
    },
  },
  {
    id: "builtin-ambient-clean",
    name: "Ambient Clean",
    builtIn: true,
    createdAt: 0,
    params: {
      preampGain: 0.05, drive: 0.02, bass: 0.5, mid: 0.4, treble: 0.55, level: 0.62, cab: true, gate: false,
      overdriveEnabled: false, overdriveDrive: 0.35, overdriveTone: 0.5, overdriveLevel: 0.5,
      delayEnabled: true, delayMs: 550, delayFeedback: 0.42, delayMix: 0.35,
      irId: null, namEnabled: false, namModelId: null,
    },
  },
];
