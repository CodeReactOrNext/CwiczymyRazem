import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  isAppLocale,
  localeDescriptor,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "./locales";

describe("normalizeLocale", () => {
  it("accepts the languages the app ships with", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("pl")).toBe("pl");
    expect(normalizeLocale("de")).toBe("de");
    expect(normalizeLocale("es")).toBe("es");
  });

  it("drops the region — there is one Spanish, not one per country", () => {
    expect(normalizeLocale("es-ES")).toBe("es");
    expect(normalizeLocale("es-419")).toBe("es");
    expect(normalizeLocale("de_AT")).toBe("de");
    expect(normalizeLocale("PL-pl")).toBe("pl");
  });

  it("falls back to English for anything it does not know", () => {
    // A value left in localStorage by a build with more languages than this one,
    // or simply nothing stored at all.
    expect(normalizeLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(42)).toBe(DEFAULT_LOCALE);
  });
});

describe("the locale list", () => {
  it("has English first, since it is the source language", () => {
    expect(SUPPORTED_LOCALES[0].code).toBe(DEFAULT_LOCALE);
  });

  it("names every language in its own language", () => {
    expect(SUPPORTED_LOCALES.map(({ label }) => label)).toEqual([
      "English",
      "Polski",
      "Deutsch",
      "Español",
    ]);
  });

  it("recognises exactly those codes", () => {
    for (const { code } of SUPPORTED_LOCALES) expect(isAppLocale(code)).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
    expect(isAppLocale("pl-PL")).toBe(false);
  });

  it("describes each one", () => {
    expect(localeDescriptor("de").englishLabel).toBe("German");
  });
});
