/**
 * In-place iterative radix-2 FFT (forward, e^-iωn) for one power-of-two size;
 * the bit-reversal and twiddle tables are built once per size.
 */
export const createFft = (size: number) => {
  const levels = Math.log2(size);
  const reversed = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    let r = 0;
    for (let bit = 0, x = i; bit < levels; bit++, x >>= 1)
      r = (r << 1) | (x & 1);
    reversed[i] = r;
  }
  const cos = new Float64Array(size / 2);
  const sin = new Float64Array(size / 2);
  for (let i = 0; i < size / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / size);
    sin[i] = Math.sin((2 * Math.PI * i) / size);
  }

  return (re: Float64Array, im: Float64Array) => {
    for (let i = 0; i < size; i++) {
      const j = reversed[i];
      if (j > i) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
    for (let len = 2; len <= size; len <<= 1) {
      const half = len >> 1;
      const step = size / len;
      for (let start = 0; start < size; start += len) {
        for (let k = 0; k < half; k++) {
          const wr = cos[k * step];
          const wi = -sin[k * step];
          const a = start + k;
          const b = a + half;
          const tr = re[b] * wr - im[b] * wi;
          const ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
  };
};

/** Smallest power of two at or above `n`. */
export const nextPowerOfTwo = (n: number): number =>
  2 ** Math.ceil(Math.log2(Math.max(1, n)));
