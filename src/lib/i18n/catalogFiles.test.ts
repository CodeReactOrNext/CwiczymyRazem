import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";
import type { TranslationDict } from "./namespaces";
import { EN_CATALOG, TRANSLATION_NAMESPACES } from "./namespaces";

/**
 * The files the browser fetches at runtime, checked against the namespace list the
 * app compiles in. A missing file is a 404 per language and per namespace; a key an
 * overlay spells differently from English is a translation that silently never
 * shows up. Neither is visible without looking, hence this.
 */
const LOCALES_DIR = join(__dirname, "../../../public/locales");

const filePath = (locale: string, namespace: string) =>
  join(LOCALES_DIR, locale, `${namespace}.json`);

const read = (locale: string, namespace: string): TranslationDict =>
  JSON.parse(readFileSync(filePath(locale, namespace), "utf8"));

/** Every dot path in a namespace file that holds a translation. */
function keyPaths(dict: TranslationDict, prefix = ""): string[] {
  return Object.entries(dict).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? keyPaths(value as TranslationDict, path)
      : [path];
  });
}

describe("translation files", () => {
  it("has a file for every namespace, in every language", () => {
    const missing = SUPPORTED_LOCALES.flatMap(({ code }) =>
      TRANSLATION_NAMESPACES.filter(
        (namespace) => !existsSync(filePath(code, namespace)),
      ).map((namespace) => `${code}/${namespace}.json`),
    );

    expect(missing).toEqual([]);
  });

  it("parses every file", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      for (const namespace of TRANSLATION_NAMESPACES) {
        expect(() => read(code, namespace)).not.toThrow();
      }
    }
  });

  it("bundles the English catalog for every namespace", () => {
    for (const namespace of TRANSLATION_NAMESPACES) {
      expect(EN_CATALOG[namespace]).toBeDefined();
    }
  });

  it("only translates keys English actually has", () => {
    const english = new Map(
      TRANSLATION_NAMESPACES.map((namespace) => [
        namespace,
        new Set(keyPaths(read(DEFAULT_LOCALE, namespace))),
      ]),
    );

    const orphans = SUPPORTED_LOCALES.filter(
      ({ code }) => code !== DEFAULT_LOCALE,
    ).flatMap(({ code }) =>
      TRANSLATION_NAMESPACES.flatMap((namespace) =>
        keyPaths(read(code, namespace))
          .filter((path) => !english.get(namespace)?.has(path))
          .map((path) => `${code}/${namespace}.json → ${path}`),
      ),
    );

    expect(orphans).toEqual([]);
  });
});
