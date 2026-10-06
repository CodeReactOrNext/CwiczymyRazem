/**
 * Languages the app ships with.
 *
 * English is the source language: every key lives in `public/locales/en` and is
 * bundled with the app. The other locales are *overlays* — a file per namespace
 * under `public/locales/<code>`, fetched on demand, where anything missing (today:
 * everything) falls back to the English string. That way adding a language is
 * adding JSON, and a half-translated language is still a usable app.
 */
export const DEFAULT_LOCALE = "en";

export type AppLocale = "en" | "pl" | "de" | "es";

export interface LocaleDescriptor {
  code: AppLocale;
  /** Shown in the picker — a language is always named in its own language. */
  label: string;
  /** English name, for places that have to stay readable to everyone (a11y, logs). */
  englishLabel: string;
}

export const SUPPORTED_LOCALES: readonly LocaleDescriptor[] = [
  { code: "en", label: "English", englishLabel: "English" },
  { code: "pl", label: "Polski", englishLabel: "Polish" },
  { code: "de", label: "Deutsch", englishLabel: "German" },
  { code: "es", label: "Español", englishLabel: "Spanish" },
];

const LOCALE_CODES: readonly string[] = SUPPORTED_LOCALES.map(({ code }) => code);

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && LOCALE_CODES.includes(value);
}

/**
 * Best supported locale for a tag like `pl`, `pl-PL` or `es-419`.
 *
 * Only the primary subtag is looked at: we have one Spanish, not one per region,
 * so `es-AR` and `es-ES` both resolve to `es`. Anything unknown (or a stored value
 * written by a build that had more languages than this one) becomes English.
 */
export function normalizeLocale(value: unknown): AppLocale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const primary = value.trim().toLowerCase().split(/[-_]/)[0];
  return isAppLocale(primary) ? primary : DEFAULT_LOCALE;
}

export function localeDescriptor(locale: AppLocale): LocaleDescriptor {
  return (
    SUPPORTED_LOCALES.find(({ code }) => code === locale) ?? SUPPORTED_LOCALES[0]
  );
}
