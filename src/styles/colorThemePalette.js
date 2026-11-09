/**
 * Light theme for the logged-in app, done at the palette level.
 *
 * The app's ~10k colour classes are written for a dark page (`bg-zinc-950`,
 * `bg-zinc-900/40` cards, `text-white`, `text-cyan-300`…). Instead of a
 * `light:` override on every one of them, the colours those classes point at
 * are CSS variables: dark values on `:root`, and a re-mapped set while the
 * player picked the light theme AND the app shell is on the page. Public pages
 * (landing, blog, features) never render the shell, so they stay dark.
 *
 * - zinc  — hand-tuned light scale: 950 is the grey page, 900 a white card,
 *           800/700 the grey wells inside a card, 400–100 the text steps.
 * - white / black — swapped, so `text-white` is the primary text and
 *           `bg-white text-black` buttons keep their contrast.
 * - accents — mirrored around 500, and the light text shades (200–400) pushed
 *           to 700/800 so they read on white instead of glowing on black.
 *
 * Shared by tailwind.config.js (colour definitions + the CSS variables).
 */
const twColors = require("tailwindcss/colors");

/** Selector under which the light values apply. */
const LIGHT_SELECTOR = "html.theme-light:has([data-app-shell])";

const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

/** Overrides the config already makes to Tailwind's defaults. */
const CUSTOM = {
  cyan: {
    50: "#ECFEFF",
    100: "#CFFAFE",
    200: "#A5F3FC",
    300: "#67E8F9",
    400: "#22D3EE",
    500: "#06B6D4",
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },
  emerald: { 400: "#34D399", 500: "#10B981", 600: "#059669" },
};

const ACCENTS = [
  "cyan",
  "amber",
  "orange",
  "emerald",
  "purple",
  "red",
  "rose",
  "green",
  "yellow",
  "sky",
  "blue",
  "violet",
  "indigo",
  "teal",
  "lime",
  "pink",
  "fuchsia",
];

const NEUTRALS = ["zinc", "gray", "slate", "stone", "neutral"];

/** Which dark-theme shade a class shows in the light theme. */
const ACCENT_LIGHT_MAP = {
  50: "950",
  100: "900",
  200: "800",
  300: "700",
  400: "600",
  500: "600",
  600: "600",
  700: "300",
  800: "200",
  900: "100",
  950: "50",
};

/**
 * Light neutral scale (r g b). Not a mirror: in the dark app the page is the
 * darkest step and cards are lighter washes over it; on a light page the page
 * is a soft grey and cards are white, with grey wells inside them.
 */
const LIGHT_NEUTRAL = {
  50: "9 9 11",
  100: "24 24 27",
  200: "39 39 42",
  300: "52 52 58",
  400: "82 82 91",
  500: "113 113 122",
  600: "161 161 170",
  700: "212 212 216",
  800: "228 228 231",
  900: "255 255 255",
  950: "234 234 237",
};

/**
 * Arsenal's own flat tokens (see tailwind.config.js) — [dark, light] pairs.
 * `accent` is the white interaction colour, so it turns to ink.
 */
const ARSENAL = {
  bg: ["#101113", "#EAEAED"],
  section: ["#17191D", "#FFFFFF"],
  card: ["#1E2126", "#F2F2F4"],
  border: ["#30343B", "#D4D4D8"],
  accent: ["#FFFFFF", "#18181B"],
  "text-primary": ["#F2F4F7", "#18181B"],
  "text-secondary": ["#B4BAC4", "#52525B"],
  "text-tertiary": ["#8C95A3", "#71717A"],
};

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const paletteOf = (name) => ({ ...twColors[name], ...(CUSTOM[name] || {}) });

const varName = (name, shade) => `--c-${name}-${shade}`;
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** `theme.extend.colors` entries pointing at the variables. */
const themedColors = () => {
  const colors = {
    white: withAlpha("--c-white"),
    black: withAlpha("--c-black"),
  };
  for (const name of [...NEUTRALS, ...ACCENTS]) {
    colors[name] = {};
    for (const shade of SHADES) colors[name][shade] = withAlpha(varName(name, shade));
  }
  // cyan is the app's interaction accent. The light theme ("ink & gold") splits
  // it by use: a faint tint (an explicit alpha below 1 — bg-cyan-500/10, hover
  // washes) reads its --c-cyan-t-* variable, which is ink there, so selections
  // are neutral greys instead of pastel; a full colour (text, bars, solid
  // fills) reads --c-cyan-*, which is gold. In the dark theme both are cyan.
  for (const shade of SHADES) {
    colors.cyan[shade] = ({ opacityValue }) => {
      const alpha = opacityValue === undefined ? "1" : String(opacityValue);
      const isTint = /^(0|0?\.\d+)$/.test(alpha);
      return `rgb(var(${isTint ? `--c-cyan-t-${shade}` : varName("cyan", shade)}) / ${alpha})`;
    };
  }
  const arsenal = (key) => withAlpha(`--c-arsenal-${key}`);
  colors.arsenal = {
    bg: arsenal("bg"),
    section: arsenal("section"),
    card: arsenal("card"),
    border: arsenal("border"),
    accent: arsenal("accent"),
    text: {
      primary: arsenal("text-primary"),
      secondary: arsenal("text-secondary"),
      tertiary: arsenal("text-tertiary"),
    },
  };
  return colors;
};

/** `{ ':root': {...}, [LIGHT_SELECTOR]: {...} }` for addBase. */
const themeVariables = () => {
  const dark = { "--c-white": "255 255 255", "--c-black": "0 0 0" };
  const light = { "--c-white": "24 24 27", "--c-black": "255 255 255" };

  for (const name of NEUTRALS) {
    const palette = paletteOf(name);
    for (const shade of SHADES) {
      dark[varName(name, shade)] = hexToRgb(palette[shade]);
      light[varName(name, shade)] = LIGHT_NEUTRAL[shade];
    }
  }
  for (const name of ACCENTS) {
    const palette = paletteOf(name);
    // Light theme "ink & gold" (owner's pick): full cyan is gold (the amber
    // scale), tinted cyan is ink — see themedColors().
    const lightPalette = name === "cyan" ? paletteOf("amber") : palette;
    for (const shade of SHADES) {
      dark[varName(name, shade)] = hexToRgb(palette[shade]);
      light[varName(name, shade)] = hexToRgb(lightPalette[ACCENT_LIGHT_MAP[shade]]);
      if (name === "cyan") {
        dark[`--c-cyan-t-${shade}`] = hexToRgb(palette[shade]);
        // Tints of the dark shades (700–950 at /30–/50) were drawn to be a
        // faint wash on near-black; on white they must stay faint too, so
        // they wash in a mid grey rather than ink.
        light[`--c-cyan-t-${shade}`] = Number(shade) >= 700 ? "113 113 122" : "24 24 27";
      }
    }
  }
  for (const [key, [darkHex, lightHex]] of Object.entries(ARSENAL)) {
    dark[`--c-arsenal-${key}`] = hexToRgb(darkHex);
    light[`--c-arsenal-${key}`] = hexToRgb(lightHex);
  }
  // `force-dark` puts the dark values back for one subtree — hardware-looking
  // surfaces (amp chassis, the tab board) that stay dark in the light theme.
  return { ":root": dark, [LIGHT_SELECTOR]: light, [`${LIGHT_SELECTOR} .force-dark`]: dark };
};

module.exports = { themedColors, themeVariables, LIGHT_SELECTOR };
