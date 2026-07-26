// Minimal RIFF/WAVE parser for cabinet IR imports. Supports PCM 16/24/32-bit and
// IEEE float32, mono or stereo (stereo is downmixed to mono by channel averaging —
// cabinet IRs are convolved against a mono signal chain). Pure function, no Electron
// dependency, so it's Vitest-testable in isolation.
function decodeWav(buffer) {
  if (
    buffer.length < 12 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("Not a valid WAV file");
  }

  let offset = 12;
  let fmt = null;
  let dataChunk = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      fmt = {
        audioFormat: buffer.readUInt16LE(chunkStart),
        numChannels: buffer.readUInt16LE(chunkStart + 2),
        sampleRate: buffer.readUInt32LE(chunkStart + 4),
        bitsPerSample: buffer.readUInt16LE(chunkStart + 14),
      };
    } else if (chunkId === "data") {
      dataChunk = { start: chunkStart, size: chunkSize };
    }

    // Chunks are word-aligned — an odd-sized chunk has one pad byte after it.
    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!fmt) throw new Error("WAV file missing fmt chunk");
  if (!dataChunk) throw new Error("WAV file missing data chunk");

  const { audioFormat, numChannels, bitsPerSample, sampleRate } = fmt;
  if (numChannels < 1) throw new Error("WAV file has no channels");
  const bytesPerSample = bitsPerSample / 8;
  const dataEnd = Math.min(buffer.length, dataChunk.start + dataChunk.size);
  const frameCount = Math.floor((dataEnd - dataChunk.start) / (bytesPerSample * numChannels));
  const mono = new Float32Array(frameCount);

  const readSample = (sampleOffset) => {
    if (audioFormat === 3 && bitsPerSample === 32) return buffer.readFloatLE(sampleOffset);
    if (audioFormat === 1 && bitsPerSample === 16) return buffer.readInt16LE(sampleOffset) / 32768;
    if (audioFormat === 1 && bitsPerSample === 24) {
      const b0 = buffer[sampleOffset], b1 = buffer[sampleOffset + 1], b2 = buffer[sampleOffset + 2];
      let s = (b2 << 16) | (b1 << 8) | b0;
      if (s & 0x800000) s -= 0x1000000;
      return s / 8388608;
    }
    if (audioFormat === 1 && bitsPerSample === 32) return buffer.readInt32LE(sampleOffset) / 2147483648;
    throw new Error(`Unsupported WAV format: audioFormat=${audioFormat} bitsPerSample=${bitsPerSample}`);
  };

  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    const frameStart = dataChunk.start + i * numChannels * bytesPerSample;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += readSample(frameStart + ch * bytesPerSample);
    }
    mono[i] = sum / numChannels;
  }

  return { sampleRate, samples: mono };
}

module.exports = { decodeWav };
