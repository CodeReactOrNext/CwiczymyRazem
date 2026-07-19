import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PillPresetKey } from "./tablaturePillPresets";
import { DEFAULT_PILL_PRESET, PILL_PRESETS } from "./tablaturePillPresets";
import type { TablatureStylePatch } from "./useTablatureWorkerBridge";

export type PaletteKey =
  | "rainbow"
  | "ocean"
  | "sunset"
  | "forest"
  | "neon"
  | "pastel"
  | "poster"
  | "vintage"
  | "colorblind"
  | "mono";
export type HitColorKey =
  | "emerald"
  | "cyan"
  | "amber"
  | "white"
  | "magenta"
  | "lime";
export type BackgroundKey =
  | "midnight"
  | "black"
  | "charcoal"
  | "navy"
  | "plum"
  | "paper"
  | "white"
  | "sepia";

export interface StringPalette {
  label: string;
  desc: string;
  /** String 1 (high e) → string 6 (low E). */
  colors: readonly string[];
}

/** Fret-pill colour sets. `rainbow` is the palette the tab shipped with. */
export const STRING_PALETTES: Record<PaletteKey, StringPalette> = {
  rainbow: {
    label: "Rainbow",
    desc: "One hue per string",
    colors: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"],
  },
  ocean: {
    label: "Ocean",
    desc: "Cool blues and violets",
    colors: ["#22d3ee", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#c084fc"],
  },
  sunset: {
    label: "Sunset",
    desc: "Warm reds through to gold",
    colors: ["#fb7185", "#f97316", "#fbbf24", "#f472b6", "#e11d48", "#c2410c"],
  },
  forest: {
    label: "Forest",
    desc: "Greens and teals",
    colors: ["#a3e635", "#4ade80", "#2dd4bf", "#22d3ee", "#15803d", "#0f766e"],
  },
  neon: {
    label: "Neon",
    desc: "Maximum contrast on a dark board",
    colors: ["#ff2d95", "#00e5ff", "#c4ff00", "#ff8a00", "#7c4dff", "#00ff9d"],
  },
  pastel: {
    label: "Pastel",
    desc: "Softer tones, easier on long sessions",
    colors: ["#fca5a5", "#fdba74", "#fde68a", "#a7f3d0", "#a5b4fc", "#d8b4fe"],
  },
  poster: {
    label: "Poster",
    desc: "Flat print colours, matte and bold",
    colors: ["#e05252", "#ef8a3c", "#e8b73a", "#3f9e63", "#4aa3df", "#8a63c9"],
  },
  vintage: {
    label: "Vintage",
    desc: "Dusty faded tones, old-poster feel",
    colors: ["#c8a24a", "#b56a4e", "#a3a08b", "#7a9e7e", "#6e86a0", "#9a7bb5"],
  },
  colorblind: {
    label: "Colourblind-safe",
    desc: "Okabe–Ito, distinct for most types",
    colors: ["#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00"],
  },
  mono: {
    label: "Mono",
    desc: "Greyscale — rely on position, not colour",
    colors: ["#fafafa", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#8b8b93", "#71717a"],
  },
};

export interface TablatureBackground {
  label: string;
  desc: string;
  /** Board colour. Also tints the tuning gutter and the played-notes fade. */
  color: string;
  /**
   * Colour of everything drawn *on* the board — staff lines, bar lines, rhythm
   * notation, time signatures, chord pills. It has to invert for light boards,
   * otherwise the white-on-white staff simply vanishes.
   */
  ink: string;
  /** Light boards also flip the small HTML overlays sitting over the canvas. */
  isLight?: boolean;
}

/** Board backgrounds. `midnight` is the colour the tab shipped with. */
export const BACKGROUNDS: Record<BackgroundKey, TablatureBackground> = {
  midnight: {
    label: "Midnight",
    desc: "Default near-black",
    color: "#09090b",
    ink: "#ffffff",
  },
  black: {
    label: "True black",
    desc: "Deepest contrast, OLED friendly",
    color: "#000000",
    ink: "#ffffff",
  },
  charcoal: {
    label: "Charcoal",
    desc: "Lifted grey, softer glare",
    color: "#18181b",
    ink: "#ffffff",
  },
  navy: {
    label: "Navy",
    desc: "Cool blue-black",
    color: "#0b1220",
    ink: "#ffffff",
  },
  plum: {
    label: "Plum",
    desc: "Warm violet-black",
    color: "#140f1c",
    ink: "#ffffff",
  },
  paper: {
    label: "Paper",
    desc: "Warm white, print-like",
    color: "#faf7f2",
    ink: "#18181b",
    isLight: true,
  },
  white: {
    label: "White",
    desc: "Plain white sheet",
    color: "#ffffff",
    ink: "#18181b",
    isLight: true,
  },
  sepia: {
    label: "Sepia",
    desc: "Aged paper, low glare",
    color: "#f2e8d5",
    ink: "#3f2d1c",
    isLight: true,
  },
};

export interface HitColor {
  label: string;
  /** Solid fill painted over a sustained note. */
  fill: string;
  /** Brighter tone used for the glow and shockwave rings. */
  glow: string;
}

/** Colour the scoring feedback paints hit notes with. */
export const HIT_COLORS: Record<HitColorKey, HitColor> = {
  emerald: { label: "Emerald", fill: "#10b981", glow: "#34d399" },
  cyan: { label: "Cyan", fill: "#06b6d4", glow: "#22d3ee" },
  amber: { label: "Amber", fill: "#f59e0b", glow: "#fbbf24" },
  white: { label: "White", fill: "#e4e4e7", glow: "#ffffff" },
  magenta: { label: "Magenta", fill: "#d946ef", glow: "#f0abfc" },
  lime: { label: "Lime", fill: "#84cc16", glow: "#bef264" },
};

/** Which viewer opens automatically when a practice session starts. */
export type DefaultViewMode = "tab" | "highway" | "notation";

export type FretTextKey = "black" | "white" | "auto";

export interface FretTextColor {
  label: string;
  desc: string;
  /** Fixed colour, or undefined for the per-pill automatic choice. */
  color?: string;
}

/** Colour of the fret number printed inside each pill. */
export const FRET_TEXT_COLORS: Record<FretTextKey, FretTextColor> = {
  black: { label: "Black", desc: "Ink on bright pills", color: "#000000" },
  white: { label: "White", desc: "For darker palettes", color: "#ffffff" },
  auto: { label: "Auto", desc: "Follows each pill's brightness" },
};

export const FRET_FONT_MIN = 0.8;
export const FRET_FONT_MAX = 1.4;

/** Horizontal spread — multiplier on the beat width. Mirrors the old zoom range. */
export const NOTE_SPACING_MIN = 0.3;
export const NOTE_SPACING_MAX = 1.75;

/** Vertical distance between strings, in world px (the renderer's base is 32). */
export const STRING_SPACING_MIN = 22;
export const STRING_SPACING_MAX = 46;
export const STRING_SPACING_DEFAULT = 32;

export interface TablatureSettings {
  // ── Session ──
  /** View shown when a practice session opens an exercise with tablature. */
  defaultViewMode: DefaultViewMode;
  // ── Shape ──
  pillPreset: PillPresetKey;
  /** Multiplier on the fret-number type size (1 = the worker's 13px base). */
  fretFontScale: number;
  fretTextColor: FretTextKey;
  /** Horizontal spread of the score (1 = default beat width). */
  noteSpacing: number;
  /** Vertical gap between strings, in world px. */
  stringSpacing: number;
  // ── Colour ──
  palette: PaletteKey;
  hitColor: HitColorKey;
  background: BackgroundKey;
  // ── Visible elements ──
  showRhythmLane: boolean;
  showChordNames: boolean;
  showTuningGutter: boolean;
  showMeasureLines: boolean;
  showTechniqueLabels: boolean;
  // ── Feedback ──
  hitAnimations: boolean;
  ambientGlow: boolean;
}

export const DEFAULT_SETTINGS: TablatureSettings = {
  defaultViewMode: "tab",
  pillPreset: DEFAULT_PILL_PRESET,
  fretFontScale: 1,
  fretTextColor: "black",
  noteSpacing: 1,
  stringSpacing: STRING_SPACING_DEFAULT,
  palette: "rainbow",
  hitColor: "emerald",
  background: "midnight",
  showRhythmLane: true,
  showChordNames: true,
  showTuningGutter: true,
  showMeasureLines: true,
  showTechniqueLabels: true,
  hitAnimations: true,
  ambientGlow: true,
};

interface TablatureSettingsStore extends TablatureSettings {
  set: <K extends keyof TablatureSettings>(
    key: K,
    value: TablatureSettings[K],
  ) => void;
  reset: () => void;
}

/**
 * Every tablature personalisation the practice session offers, persisted under
 * one localStorage key. Zoom and viewer height stay out of here on purpose:
 * they are dragged/stepped live from the tab itself rather than configured.
 */
export const useTablatureSettings = create<TablatureSettingsStore>()(
  persist(
    (setState) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) =>
        setState({ [key]: value } as Partial<TablatureSettings>),
      reset: () => setState({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "practice-tab-settings",
      version: 2,
      /**
       * Drops stored choices that no longer exist (an option removed between
       * builds) back to their default, so the pickers show a real selection
       * instead of nothing. The lookups in `useTablatureStyle` guard the same
       * case at read time; this just heals the stored value once.
       */
      migrate: (persisted) => {
        const s = {
          ...DEFAULT_SETTINGS,
          ...(persisted as Partial<TablatureSettings>),
        };
        if (!(s.pillPreset in PILL_PRESETS))
          s.pillPreset = DEFAULT_SETTINGS.pillPreset;
        if (!(s.palette in STRING_PALETTES))
          s.palette = DEFAULT_SETTINGS.palette;
        if (!(s.hitColor in HIT_COLORS)) s.hitColor = DEFAULT_SETTINGS.hitColor;
        if (!(s.background in BACKGROUNDS))
          s.background = DEFAULT_SETTINGS.background;
        if (!(s.fretTextColor in FRET_TEXT_COLORS)) {
          s.fretTextColor = DEFAULT_SETTINGS.fretTextColor;
        }
        return s;
      },
    },
  ),
);

/**
 * Resolves the stored settings into what the renderers actually consume: the
 * worker STYLE patch plus the raw palette (which has to reach the render data
 * separately, since pill colours are baked into each note there).
 */
export function useTablatureStyle(): {
  settings: TablatureSettings;
  palette: readonly string[];
  /** Board colour — also needed on the viewer's own container element. */
  background: string;
  /** True for light boards, so HTML overlays over the canvas can flip too. */
  isLightBoard: boolean;
  style: TablatureStylePatch;
} {
  const settings = useTablatureSettings();
  // Every lookup below falls back to the default, because these keys come from
  // localStorage: a value saved by an older build (an option since renamed or
  // dropped) would otherwise resolve to undefined and crash the whole session.
  const palette = (
    STRING_PALETTES[settings.palette] ??
    STRING_PALETTES[DEFAULT_SETTINGS.palette]
  ).colors;
  const board =
    BACKGROUNDS[settings.background] ??
    BACKGROUNDS[DEFAULT_SETTINGS.background];
  const background = board.color;

  const style = useMemo<TablatureStylePatch>(() => {
    const pill =
      PILL_PRESETS[settings.pillPreset] ??
      PILL_PRESETS[DEFAULT_SETTINGS.pillPreset];
    const hit =
      HIT_COLORS[settings.hitColor] ?? HIT_COLORS[DEFAULT_SETTINGS.hitColor];
    const fretText =
      FRET_TEXT_COLORS[settings.fretTextColor] ??
      FRET_TEXT_COLORS[DEFAULT_SETTINGS.fretTextColor];
    return {
      pillHeight: pill.height,
      pillCorner: pill.corner,
      fretFontScale: settings.fretFontScale,
      stringColors: palette,
      hitFill: hit.fill,
      hitGlow: hit.glow,
      background,
      ink: board.ink,
      stringSpacing: settings.stringSpacing,
      // "auto" is resolved per pill inside the worker, which knows each note's colour.
      fretText: fretText.color ?? "auto",
      showRhythmLane: settings.showRhythmLane,
      showChordNames: settings.showChordNames,
      showMeasureLines: settings.showMeasureLines,
      showTechniqueLabels: settings.showTechniqueLabels,
      hitAnimations: settings.hitAnimations,
    };
  }, [
    palette,
    background,
    board.ink,
    settings.pillPreset,
    settings.hitColor,
    settings.fretFontScale,
    settings.fretTextColor,
    settings.stringSpacing,
    settings.showRhythmLane,
    settings.showChordNames,
    settings.showMeasureLines,
    settings.showTechniqueLabels,
    settings.hitAnimations,
  ]);

  return {
    settings,
    palette,
    background,
    isLightBoard: !!board.isLight,
    style,
  };
}
