import { describe, expect, it } from "vitest";

import { decodeWav } from "./wavDecoder";

function buildWavBuffer({ sampleRate, numChannels, bitsPerSample, audioFormat, frames }) {
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = frames.length * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(audioFormat, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (const frame of frames) {
    for (let ch = 0; ch < numChannels; ch++) {
      const v = frame[ch];
      if (audioFormat === 3 && bitsPerSample === 32) buffer.writeFloatLE(v, offset);
      else if (audioFormat === 1 && bitsPerSample === 16) buffer.writeInt16LE(v, offset);
      else throw new Error("unsupported combination in test helper");
      offset += bytesPerSample;
    }
  }
  return buffer;
}

describe("decodeWav", () => {
  it("decodes 16-bit PCM mono", () => {
    const buf = buildWavBuffer({
      sampleRate: 44100, numChannels: 1, bitsPerSample: 16, audioFormat: 1,
      frames: [[0], [16384], [-16384]],
    });
    const { sampleRate, samples } = decodeWav(buf);
    expect(sampleRate).toBe(44100);
    expect(Array.from(samples)).toEqual([0, 0.5, -0.5]);
  });

  it("downmixes 16-bit PCM stereo by averaging channels", () => {
    const buf = buildWavBuffer({
      sampleRate: 48000, numChannels: 2, bitsPerSample: 16, audioFormat: 1,
      frames: [[8192, 24576], [16384, -16384]],
    });
    const { sampleRate, samples } = decodeWav(buf);
    expect(sampleRate).toBe(48000);
    expect(samples[0]).toBeCloseTo(0.5, 5);
    expect(samples[1]).toBeCloseTo(0, 5);
  });

  it("decodes 32-bit float mono", () => {
    const buf = buildWavBuffer({
      sampleRate: 48000, numChannels: 1, bitsPerSample: 32, audioFormat: 3,
      frames: [[0.25], [-0.75]],
    });
    const { samples } = decodeWav(buf);
    expect(samples[0]).toBeCloseTo(0.25, 6);
    expect(samples[1]).toBeCloseTo(-0.75, 6);
  });

  it("throws on a file that isn't a WAV", () => {
    expect(() => decodeWav(Buffer.from("not a wav file at all"))).toThrow();
  });
});
