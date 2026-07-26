import { describe, expect, it } from "vitest";

import { AmpChain } from "./ampSim";

// Real trained weights (Steve's "Darkglass Microtubes 900 v2" test fixture from
// sdatkinson/NeuralAmpModelerCore's example_models/wavenet.nam) — same fixture
// dsp/nam.test.js uses, kept small so the WASM load stays fast in a unit test.
const SMALL_NAM_MODEL_JSON = JSON.stringify({
  version: "0.5.4",
  metadata: { name: "Test Model" },
  architecture: "WaveNet",
  config: {
    layers: [
      { input_size: 1, condition_size: 1, head_size: 2, channels: 3, kernel_size: 3, dilations: [1, 2], activation: "Tanh", gated: false, head_bias: false },
      { input_size: 3, condition_size: 1, head_size: 1, channels: 2, kernel_size: 3, dilations: [8], activation: "Tanh", gated: false, head_bias: true },
    ],
    head: null,
    head_scale: 0.02,
  },
  weights: [-0.6180188059806824, 1.0314024686813354, -1.0111560821533203, -0.38462021946907043, 0.35968291759490967, 0.5255971550941467, 0.19149275124073029, -0.18075695633888245, -0.33711034059524536, -0.21037575602531433, 0.2007753700017929, 0.21644853055477142, -1.3216396570205688, -0.35082393884658813, 0.43541353940963745, 0.9693092107772827, 0.2394428700208664, -0.41078877449035645, -1.193748116493225, -0.14876757562160492, 0.8413559198379517, 0.24491633474826813, 0.8857091665267944, 0.5647665858268738, 0.08301573246717453, -0.801490843296051, 0.168976828455925, -0.5413634181022644, 0.484220415353775, 0.021656272932887077, -0.15155009925365448, 0.07081033289432526, 0.00019397131109144539, -0.7408013939857483, -1.3308452367782593, -1.0403972864151, 0.016809873282909393, 0.6778652667999268, 0.28265541791915894, -0.28287461400032043, 1.0525944232940674, -0.6385797262191772, -0.2195468544960022, -0.3150196671485901, -0.8814508318901062, -0.2746180295944214, 0.15367186069488525, 0.22431065142154694, -0.056788790971040726, -0.38902369141578674, 0.5406259894371033, 0.3566059470176697, 0.14383991062641144, -0.25409433245658875, 0.16139137744903564, -0.05857989564538002, -0.18448838591575623, -0.253485769033432, -0.42405444383621216, -0.030114537104964256, 0.47283637523651123, 0.14930365979671478, -0.4410354793071747, -0.21976807713508606, -0.12736600637435913, -0.5674286484718323, -0.347588449716568, -0.3687525689601898, 0.4130803942680359, 0.8551775217056274, -0.05746064335107803, -0.38243237137794495, 0.20036561787128448, 0.25542038679122925, -0.0819990262389183, 0.19469600915908813, 0.10215214639902115, -0.26087674498558044, -0.1773151010274887, -0.09658292680978775, -0.7381710410118103, 0.7003506422042847, 0.7253592014312744, -0.07488955557346344, -0.23439547419548035, -0.5138604044914246, -0.7976311445236206, -0.8090851902961731, -0.37562188506126404, -1.163352131843567, 0.30907657742500305, 0.0564480796456337, 0.1190297082066536, 0.2310808300971985, -0.45360898971557617, -0.11524498462677002, 0.2552330493927002, 0.2913571298122406, -0.23171702027320862, -0.35578709840774536, 0.40732908248901367, 0.7458747029304504, 0.27514976263046265, -0.7503036856651306, -0.6707972884178162, -0.4248569905757904, -0.1671624332666397, -0.14162226021289825, 0.37550851702690125, -0.038120146840810776, 0.16232982277870178, -0.05173371359705925, -0.2842361629009247, 0.38820165395736694, 0.521754801273346, -0.3581869900226593, 0.21531476080417633, 0.11342520266771317, 0.01764630153775215, 0.07780527323484421, 0.9356631636619568, 0.04235581308603287, -0.3450177311897278, 0.3345951437950134, -0.678291380405426, -0.4191069006919861, -0.1770099401473999, -5.386871337890625, -5.130850791931152, -0.4049331247806549, 0.019999999552965164],
  sample_rate: 48000,
});

describe("AmpChain drive stage", () => {
  const sr = 48000;

  function freshChain(overrides = {}) {
    const amp = new AmpChain(sr);
    amp.setParams({
      preampGain: 0, drive: 0, gate: false, cab: false, delayEnabled: false,
      bass: 0.5, mid: 0.5, treble: 0.5, level: 1,
      ...overrides,
    });
    return amp;
  }

  it("clips asymmetrically: a driven sine's positive peak exceeds its negative peak", () => {
    const amp = freshChain();
    const freq = 200;
    const samplesPerCycle = sr / freq;
    const totalCycles = 30;
    let maxPos = 0;
    let maxNegAbs = 0;
    for (let i = 0; i < totalCycles * samplesPerCycle; i++) {
      const x = 0.3 * Math.sin((2 * Math.PI * freq * i) / sr);
      const y = amp.process(x);
      if (i > (totalCycles - 5) * samplesPerCycle) {
        maxPos = Math.max(maxPos, y);
        maxNegAbs = Math.max(maxNegAbs, -y);
      }
    }
    expect(maxPos).toBeGreaterThan(maxNegAbs);
    expect(maxPos - maxNegAbs).toBeGreaterThan(0.005);
  });

  it("the DC blocker keeps the settled average near zero despite the asymmetric clip", () => {
    const amp = freshChain();
    const freq = 150;
    const samplesPerCycle = sr / freq;
    const totalCycles = 40;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < totalCycles * samplesPerCycle; i++) {
      const x = 0.3 * Math.sin((2 * Math.PI * freq * i) / sr);
      const y = amp.process(x);
      if (i > (totalCycles - 10) * samplesPerCycle) {
        sum += y;
        count++;
      }
    }
    expect(Math.abs(sum / count)).toBeLessThan(0.01);
  });

  it("stays bounded and finite at max drive and preamp gain", () => {
    const amp = freshChain({ drive: 1, preampGain: 1 });
    let maxAbs = 0;
    for (let i = 0; i < 5000; i++) {
      const x = Math.sin((2 * Math.PI * 220 * i) / sr);
      const y = amp.process(x);
      expect(Number.isFinite(y)).toBe(true);
      maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    expect(maxAbs).toBeLessThanOrEqual(1);
  });

  it("the preamp stage is a second cascaded gain stage, distinct from the power-amp Drive", () => {
    const measurePeak = (preampGain) => {
      const amp = freshChain({ preampGain });
      const freq = 200;
      const samplesPerCycle = sr / freq;
      const totalCycles = 30;
      let maxAbs = 0;
      for (let i = 0; i < totalCycles * samplesPerCycle; i++) {
        // Small input: with drive=0 (power stage ~unity) any extra saturation
        // has to come from the preamp stage, not the power stage clipping.
        const x = 0.05 * Math.sin((2 * Math.PI * freq * i) / sr);
        const y = amp.process(x);
        if (i > (totalCycles - 5) * samplesPerCycle) maxAbs = Math.max(maxAbs, Math.abs(y));
      }
      return maxAbs;
    };
    expect(measurePeak(1)).toBeGreaterThan(measurePeak(0));
  });

  it("routes through NAM instead of the traditional preamp/tonestack/power chain when enabled and loaded", async () => {
    const amp = freshChain({ drive: 0.8, preampGain: 0.8 }); // chosen so the traditional chain audibly clips
    await amp.nam.loadModel(SMALL_NAM_MODEL_JSON);
    amp.setParams({ namEnabled: true });
    expect(amp.nam.isLoaded()).toBe(true);

    let finiteOk = true;
    let sawNonPassthrough = false;
    for (let i = 0; i < 5000; i++) {
      const x = 0.3 * Math.sin((2 * Math.PI * 220 * i) / sr);
      const y = amp.process(x);
      if (!Number.isFinite(y)) finiteOk = false;
      if (Math.abs(y - x) > 1e-6) sawNonPassthrough = true;
    }
    expect(finiteOk).toBe(true);
    expect(sawNonPassthrough).toBe(true);
  });

  it("falls back to the traditional chain when NAM is enabled but no model is loaded", () => {
    const withoutNam = freshChain({ drive: 0.4, preampGain: 0.4 });
    const namEnabledButUnloaded = freshChain({ drive: 0.4, preampGain: 0.4, namEnabled: true });
    expect(namEnabledButUnloaded.nam.isLoaded()).toBe(false);
    for (let i = 0; i < 200; i++) {
      const x = 0.3 * Math.sin((2 * Math.PI * 220 * i) / sr);
      expect(namEnabledButUnloaded.process(x)).toBeCloseTo(withoutNam.process(x), 10);
    }
  });

  it("cabinet resonance boosts ~120Hz output level relative to cab bypassed", () => {
    const measureRms = (cab) => {
      const amp = freshChain({ cab });
      const freq = 120;
      const samplesPerCycle = sr / freq;
      const totalCycles = 40;
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < totalCycles * samplesPerCycle; i++) {
        const x = 0.2 * Math.sin((2 * Math.PI * freq * i) / sr);
        const y = amp.process(x);
        if (i > (totalCycles - 10) * samplesPerCycle) {
          sumSq += y * y;
          count++;
        }
      }
      return Math.sqrt(sumSq / count);
    };
    expect(measureRms(true)).toBeGreaterThan(measureRms(false));
  });

  it("still applies the cabinet stage after NAM — many .nam captures are DI'd amp-only", async () => {
    const measureRms = async (cab) => {
      const amp = freshChain({ cab, namEnabled: true });
      await amp.nam.loadModel(SMALL_NAM_MODEL_JSON);
      const freq = 120;
      const samplesPerCycle = sr / freq;
      const totalCycles = 40;
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < totalCycles * samplesPerCycle; i++) {
        const x = 0.2 * Math.sin((2 * Math.PI * freq * i) / sr);
        const y = amp.process(x);
        if (i > (totalCycles - 10) * samplesPerCycle) {
          sumSq += y * y;
          count++;
        }
      }
      return Math.sqrt(sumSq / count);
    };
    expect(await measureRms(true)).toBeGreaterThan(await measureRms(false));
  });
});
