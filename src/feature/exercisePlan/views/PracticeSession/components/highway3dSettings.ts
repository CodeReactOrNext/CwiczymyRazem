import { create } from "zustand";

import type { PaletteKey } from "./tablatureSettings";

export type GemShapeKey = "rounded" | "sharp" | "coin" | "hex";

export interface GemShape {
  label: string;
  desc: string;
}

/** Note-block silhouettes on the highway. `rounded` is what it shipped with. */
export const GEM_SHAPES: Record<GemShapeKey, GemShape> = {
  rounded: { label: "Rounded", desc: "Soft-edged block" },
  sharp: { label: "Sharp", desc: "Hard-edged block" },
  coin: { label: "Coin", desc: "Round disc facing you" },
  hex: { label: "Hex", desc: "Six-sided tag" },
};

export const GEM_SHAPE_ORDER: GemShapeKey[] = [
  "rounded",
  "sharp",
  "coin",
  "hex",
];

export type Highway3DThemeKey =
  | "waves"
  | "midnight"
  | "sunset"
  | "aurora"
  | "ember"
  | "void"
  | "ice"
  | "blackhole";

export interface Highway3DTheme {
  label: string;
  desc: string;
  /** Scene background and fog colour. */
  bg: string;
  /** Three radial blobs painted into the backdrop nebula texture. */
  nebula: readonly [string, string, string];
  /** Point light washing the hit zone, and the tone approaching gems catch. */
  hitLight: string;
}

/**
 * Backdrop atmospheres for the highway. Each one repaints the sky, the fog and
 * the light around the hit line together, so the board reads as one place
 * rather than a recoloured background. `midnight` is the original look.
 */
export const HIGHWAY3D_THEMES: Record<Highway3DThemeKey, Highway3DTheme> = {
  waves: {
    label: "Particle Waves",
    desc: "A rolling sea of glowing dots",
    bg: "#05060a",
    nebula: [
      "rgba(56,189,248,0.30)",
      "rgba(129,140,248,0.28)",
      "rgba(14,116,144,0.26)",
    ],
    hitLight: "#7dd3fc",
  },
  midnight: {
    label: "Midnight",
    desc: "Deep violet space — the original",
    bg: "#0a0a0f",
    nebula: [
      "rgba(76,29,149,0.50)",
      "rgba(14,116,144,0.40)",
      "rgba(30,64,175,0.30)",
    ],
    hitLight: "#22d3ee",
  },
  sunset: {
    label: "Sunset Drive",
    desc: "Synthwave sun over a rushing neon grid",
    bg: "#150a1c",
    nebula: [
      "rgba(219,39,119,0.55)",
      "rgba(249,115,22,0.40)",
      "rgba(126,34,206,0.40)",
    ],
    hitLight: "#ff2d95",
  },
  aurora: {
    label: "Aurora",
    desc: "Waving light curtains and falling snow",
    bg: "#03120e",
    nebula: [
      "rgba(16,185,129,0.50)",
      "rgba(34,211,238,0.35)",
      "rgba(59,130,246,0.30)",
    ],
    hitLight: "#34d399",
  },
  ember: {
    label: "Ember",
    desc: "Embers rising out of the dark",
    bg: "#150806",
    nebula: [
      "rgba(220,38,38,0.50)",
      "rgba(245,158,11,0.35)",
      "rgba(120,53,15,0.40)",
    ],
    hitLight: "#f97316",
  },
  void: {
    label: "Void",
    desc: "Fly through a tunnel of neon rings",
    bg: "#000000",
    nebula: [
      "rgba(30,41,59,0.35)",
      "rgba(51,65,85,0.25)",
      "rgba(15,23,42,0.30)",
    ],
    hitLight: "#818cf8",
  },
  ice: {
    label: "Ice",
    desc: "Slow crystal shards drifting past",
    bg: "#04101a",
    nebula: [
      "rgba(56,189,248,0.45)",
      "rgba(165,243,252,0.30)",
      "rgba(37,99,235,0.35)",
    ],
    hitLight: "#7dd3fc",
  },
  blackhole: {
    label: "Black Hole",
    desc: "A lensed accretion disk around a dark event horizon",
    bg: "#03020a",
    nebula: [
      "rgba(66,42,120,0.30)",
      "rgba(24,60,90,0.22)",
      "rgba(120,60,30,0.24)",
    ],
    hitLight: "#ffab5e",
  },
};

export const HIGHWAY3D_THEME_ORDER: Highway3DThemeKey[] = [
  "waves",
  "midnight",
  "sunset",
  "aurora",
  "ember",
  "void",
  "ice",
  "blackhole",
];

/**
 * Every visual knob of the 3D highway. Geometry-shaping settings (marked
 * "rebuild") re-create the scene when changed; the rest apply live in the rAF
 * loop. Shared between the in-view slider panel and the settings page, so both
 * edit the same state and the preview updates as you drag.
 */
export interface Highway3DViewSettings {
  // camera
  angleDeg: number; // highway shear angle (0 = straight)
  camHeight: number; // camera height multiplier
  camDistance: number; // camera distance multiplier
  camFov: number; // field of view (deg)
  camPitch: number; // look-target distance multiplier (higher = flatter view)
  windowWidth: number; // visible fret-window width multiplier (rebuild)
  smartZoom: number; // 0..1 — auto zoom-out strength to fit the upcoming note cluster
  neckDolly: number; // 0..1 — log-fret camera dolly (drops lower/closer up the neck)
  // motion
  noteSpacing: number; // z-distance between beats multiplier (rebuild)
  panSpeed: number; // camera pan damping rate (higher = snappier)
  panLookahead: number; // beats scanned ahead when picking the fret window
  // notes
  gemSize: number; // note gem size multiplier (rebuild)
  spawnFade: number; // beats over which far notes materialize (0 = pop in)
  farScale: number; // 0..1 — distance size boost so far tags stay readable
  farDim: number; // 0..0.9 — how deep upcoming notes sink into the dark
  numberSize: number; // fret-number plate size multiplier, 0 hides (rebuild)
  badgeSize: number; // technique badge size multiplier, 0 hides (rebuild)
  tailOpacity: number; // sustain tail opacity
  stemOpacity: number; // note stem opacity
  shadowOpacity: number; // gem ground-shadow opacity
  // neck & strings
  stringGap: number; // vertical air between neighbouring strings (rebuild)
  dimStrength: number; // 0..1 — how hard inactive strings are dimmed
  stringBoost: number; // active string thickness multiplier
  hlLookahead: number; // beats ahead that count as "play this string now"
  neckOpacity: number; // translucent fretboard face opacity
  inlayOpacity: number; // inlay dot opacity
  fretLabelSize: number; // under-neck fret number size multiplier (rebuild)
  // effects
  anchorOpacity: number; // anchor-zone glow opacity
  hitGlow: number; // hit-line glow base opacity
  beatPulse: number; // 0..1 — beat-pulse strength (nebula + hit glow)
  nebulaOpacity: number; // backdrop nebula base opacity
  starsOpacity: number; // starfield opacity
  particles: number; // particles spawned per hit (0 disables bursts)
  sustainSparks: number; // spark shower while a parked sustain is held (0 disables)
  echoStrength: number; // hit-flash echo gem opacity (0 disables)
  ghostPreview: number; // ghost note preview strength at the neck (0 disables)
  fogDistance: number; // fog far-distance multiplier
  laneShade: number; // alternate lane shading opacity
  boardMarkers: number; // fret numbers painted on the board — opacity
  boardOpacity: number; // highway ribbon surface opacity (1 = solid, 0 = glass)
  // ── appearance (non-numeric; both rebuild the scene) ──
  gemShape: GemShapeKey;
  /** Per-string colours, shared vocabulary with the flat tablature. */
  palette: PaletteKey;
  /** Backdrop atmosphere (sky, fog and hit-zone light). */
  theme: Highway3DThemeKey;
}

/** Slider-driven keys only — the shape/palette pickers have their own setters. */
export type Highway3DNumericKey = {
  [K in keyof Highway3DViewSettings]: Highway3DViewSettings[K] extends number
    ? K
    : never;
}[keyof Highway3DViewSettings];

export const HW_DEFAULTS: Highway3DViewSettings = {
  angleDeg: 11,
  camHeight: 1.7,
  camDistance: 1.4,
  camFov: 48,
  camPitch: 0.5,
  windowWidth: 0.7,
  smartZoom: 0.1,
  neckDolly: 0,
  noteSpacing: 1.6,
  panSpeed: 0.5,
  panLookahead: 5,
  gemSize: 0.8,
  spawnFade: 4,
  farScale: 0,
  farDim: 0.55,
  numberSize: 0.95,
  badgeSize: 0.95,
  tailOpacity: 0.35,
  stemOpacity: 0.6,
  shadowOpacity: 0.55,
  stringGap: 0.38,
  dimStrength: 1,
  stringBoost: 2,
  hlLookahead: 1.25,
  neckOpacity: 0,
  inlayOpacity: 0.7,
  fretLabelSize: 0.8,
  anchorOpacity: 0.3,
  hitGlow: 0,
  beatPulse: 1,
  nebulaOpacity: 1,
  starsOpacity: 1,
  particles: 30,
  sustainSparks: 1,
  echoStrength: 1,
  ghostPreview: 1,
  fogDistance: 0.7,
  laneShade: 0,
  boardMarkers: 0.35,
  boardOpacity: 1,
  gemShape: "rounded",
  palette: "rainbow",
  theme: "midnight",
};

export type Highway3DSettingKey = Highway3DNumericKey;

const pct = (v: number) => `${Math.round(v * 100)}%`;
const deg = (v: number) => `${v}°`;

export interface Highway3DSettingDef {
  key: Highway3DSettingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

/**
 * Sliders shown to the player. The full settings object still carries every
 * other knob — they keep their defaults and stay available for tuning in code;
 * only these two proved worth exposing.
 */
export const HIGHWAY3D_SETTING_SECTIONS: {
  title: string;
  items: Highway3DSettingDef[];
}[] = [
  {
    title: "Camera",
    items: [
      {
        key: "angleDeg",
        label: "Highway angle",
        min: 0,
        max: 32,
        step: 1,
        fmt: deg,
      },
      {
        key: "windowWidth",
        label: "Window width",
        min: 0.7,
        max: 1.6,
        step: 0.05,
        fmt: pct,
      },
    ],
  },
  {
    title: "Board",
    items: [
      {
        key: "boardOpacity",
        label: "Board opacity",
        min: 0,
        max: 1,
        step: 0.05,
        fmt: pct,
      },
    ],
  },
];

const HW_SETTINGS_KEY = "riffquest.highway3d.view";

/**
 * The only keys the UI still exposes. Everything else always loads at its
 * default: values set through the old full slider panel would otherwise stick
 * in storage forever with no control left to change them (e.g. a stray lane
 * shading painting every other fret dark).
 */
const EXPOSED_KEYS = [
  "angleDeg",
  "windowWidth",
  "boardOpacity",
  "gemShape",
  "palette",
  "theme",
] as const;

function loadViewSettings(): Highway3DViewSettings {
  if (typeof window === "undefined") return HW_DEFAULTS;
  try {
    const stored = window.localStorage.getItem(HW_SETTINGS_KEY);
    if (!stored) return HW_DEFAULTS;
    const parsed = JSON.parse(stored) as Partial<Highway3DViewSettings>;
    const s = { ...HW_DEFAULTS } as unknown as Record<string, unknown>;
    for (const k of EXPOSED_KEYS) {
      if (parsed[k] !== undefined) s[k] = parsed[k];
    }
    // A stored theme that no longer exists (removed backdrop) falls back
    // to the default instead of leaving the picker with no valid selection.
    if (!((s.theme as string) in HIGHWAY3D_THEMES)) s.theme = HW_DEFAULTS.theme;
    return s as unknown as Highway3DViewSettings;
  } catch {
    return HW_DEFAULTS;
  }
}

function saveViewSettings(s: Highway3DViewSettings) {
  try {
    window.localStorage.setItem(HW_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — settings just won't persist */
  }
}

interface Highway3DSettingsStore {
  settings: Highway3DViewSettings;
  setSetting: (key: Highway3DSettingKey, value: number) => void;
  setGemShape: (shape: GemShapeKey) => void;
  setPalette: (palette: PaletteKey) => void;
  setTheme: (theme: Highway3DThemeKey) => void;
  reset: () => void;
}

/**
 * Deliberately hand-rolled persistence rather than zustand's `persist`
 * middleware: the key already holds a bare settings object from before this was
 * lifted out of the component, and `persist` would wrap it in its own envelope
 * and silently drop everyone's saved view.
 */
export const useHighway3DSettings = create<Highway3DSettingsStore>((set) => ({
  settings: loadViewSettings(),
  setSetting: (key, value) =>
    set((s) => {
      const next = { ...s.settings, [key]: value };
      saveViewSettings(next);
      return { settings: next };
    }),
  setGemShape: (gemShape) =>
    set((s) => {
      const next = { ...s.settings, gemShape };
      saveViewSettings(next);
      return { settings: next };
    }),
  setPalette: (palette) =>
    set((s) => {
      const next = { ...s.settings, palette };
      saveViewSettings(next);
      return { settings: next };
    }),
  setTheme: (theme) =>
    set((s) => {
      const next = { ...s.settings, theme };
      saveViewSettings(next);
      return { settings: next };
    }),
  reset: () => {
    saveViewSettings(HW_DEFAULTS);
    return set({ settings: HW_DEFAULTS });
  },
}));
