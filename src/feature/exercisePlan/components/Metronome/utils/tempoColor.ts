/** Tempo colour code shared by every BPM readout in a session — slow is
 *  green, medium amber, fast red — so a number reads as "a tempo" wherever
 *  it shows up (the metronome bar, the speed control, the mobile island). */
export const tempoColor = (bpm: number) =>
  bpm < 80 ? "text-emerald-400" : bpm < 120 ? "text-amber-400" : "text-red-400";

export const tempoSliderRange = (bpm: number) =>
  bpm < 80
    ? "[&_[data-slot=slider-range]]:bg-emerald-500"
    : bpm < 120
      ? "[&_[data-slot=slider-range]]:bg-amber-500"
      : "[&_[data-slot=slider-range]]:bg-red-500";
