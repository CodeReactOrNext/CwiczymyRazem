import { useSyncExternalStore } from "react";

/**
 * Light / dark theme of the logged-in app, chosen per device (like the language).
 *
 * The choice is a class on <html> — `theme-light` — and the colour variables
 * only switch while the app shell is on the page too (see
 * src/styles/colorThemePalette.js), so the landing and other public pages stay
 * dark whatever was picked. An inline script in _document sets the class before
 * the first paint, so a light-theme player never sees a dark flash.
 */
export type ColorTheme = "dark" | "light";

export const COLOR_THEME_STORAGE_KEY = "riffquest-color-theme";
export const LIGHT_THEME_CLASS = "theme-light";

const listeners = new Set<() => void>();

export const readColorTheme = (): ColorTheme => {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains(LIGHT_THEME_CLASS) ? "light" : "dark";
};

export const setColorTheme = (theme: ColorTheme) => {
  document.documentElement.classList.toggle(LIGHT_THEME_CLASS, theme === "light");
  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked — the choice still holds until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useColorTheme = (): ColorTheme =>
  useSyncExternalStore(subscribe, readColorTheme, () => "dark");

/**
 * Runs inline in <head> before the page paints. Plain ES5, no imports — it is
 * serialised into the HTML.
 */
export const COLOR_THEME_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  COLOR_THEME_STORAGE_KEY,
)})==="light")document.documentElement.classList.add(${JSON.stringify(LIGHT_THEME_CLASS)})}catch(e){}`;

/**
 * A bright accent hex (rarity, part tier, condition grade…) as a text colour
 * that stays readable in both themes: `var(--tx-<hex>, <hex>)`. The dark theme
 * defines no such variable, so the hex shows as is; the light theme maps each
 * known bright hex to a darker shade of the same hue (see globals.css). Only
 * for text — backgrounds and tints keep the raw hex.
 */
/**
 * Any accent hex (a guild's colour, an item rarity) as ink that reads in both
 * themes, for hexes too many to map one by one like readableText does. It is
 * the hex mixed with black by --ink-mix: 0% in the dark theme (the hex as is),
 * about half in the light one, which turns a glowing cyan into a deep teal.
 */
export const inkAccent = (hex: string): string =>
  `color-mix(in srgb, ${hex}, #000 var(--ink-mix, 0%))`;

/** A faint wash of inkAccent(hex), for a chip or plate behind that ink. */
export const inkWash = (hex: string, percent: number): string =>
  `color-mix(in srgb, ${inkAccent(hex)} ${percent}%, transparent)`;

export const readableText = (hex: string | undefined): string | undefined =>
  hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? `var(--tx-${hex.slice(1).toLowerCase()}, ${hex})` : hex;
