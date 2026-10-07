import { describe, expect, it } from "vitest";

import type { CatalogsByLocale } from "./translate";
import {
  createTranslator,
  interpolate,
  lookup,
  resolve,
  splitKey,
} from "./translate";

const catalogs: CatalogsByLocale = {
  en: {
    settings: {
      language: { title: "Language", subtitle: "On this device" },
      save: "Save",
      count: 3,
    },
    common: { save: "Store", shared: "Shared" },
  },
  pl: {
    settings: {
      language: { title: "Język" },
    },
    common: { shared: "Wspólne" },
  },
};

describe("lookup", () => {
  it("reads a dot path", () => {
    expect(lookup(catalogs.en?.settings, "language.title")).toBe("Language");
    expect(lookup(catalogs.en?.settings, "save")).toBe("Save");
  });

  it("returns nothing for a missing path", () => {
    expect(lookup(catalogs.en?.settings, "language.missing")).toBeUndefined();
    expect(lookup(catalogs.en?.settings, "save.deeper")).toBeUndefined();
    expect(lookup(undefined, "save")).toBeUndefined();
  });

  it("refuses a path that lands on a parent node", () => {
    // Rendering it would print [object Object] on the screen.
    expect(lookup(catalogs.en?.settings, "language")).toBeUndefined();
  });
});

describe("interpolate", () => {
  it("fills placeholders", () => {
    expect(interpolate("Playing for {{years}} years", { years: 7 })).toBe(
      "Playing for 7 years",
    );
  });

  it("leaves placeholders it was given nothing for", () => {
    expect(interpolate("Hi {{name}}", {})).toBe("Hi {{name}}");
    expect(interpolate("Hi {{name}}")).toBe("Hi {{name}}");
  });
});

describe("splitKey", () => {
  it("splits a namespaced key", () => {
    expect(splitKey("settings:language.title")).toEqual({
      namespace: "settings",
      path: "language.title",
    });
  });

  it("keeps a key with no namespace whole", () => {
    expect(splitKey("language.title")).toEqual({ path: "language.title" });
    // "foo" is not a namespace, so the colon is part of the key.
    expect(splitKey("foo:bar")).toEqual({ path: "foo:bar" });
  });
});

describe("resolve", () => {
  it("prefers the active locale and falls back to English per key", () => {
    expect(resolve(catalogs, "pl", ["settings"], "language.title")).toBe(
      "Język",
    );
    expect(resolve(catalogs, "pl", ["settings"], "language.subtitle")).toBe(
      "On this device",
    );
  });

  it("reads English straight off, with no second lookup", () => {
    expect(resolve(catalogs, "en", ["settings"], "language.title")).toBe(
      "Language",
    );
  });

  it("honours namespace order over translated-ness", () => {
    // `common` is listed second, so settings' English "Save" wins even though
    // `common` is where a Polish string would have been found.
    expect(resolve(catalogs, "pl", ["settings", "common"], "save")).toBe(
      "Save",
    );
    expect(resolve(catalogs, "pl", ["common", "settings"], "save")).toBe(
      "Store",
    );
  });

  it("uses the namespace in the key when there is one", () => {
    expect(resolve(catalogs, "pl", ["settings"], "common:shared")).toBe(
      "Wspólne",
    );
    expect(resolve(catalogs, "pl", ["settings"], "common:save")).toBe("Store");
  });

  it("returns nothing when no namespace has the key", () => {
    expect(resolve(catalogs, "pl", ["settings"], "nope")).toBeUndefined();
    expect(resolve(catalogs, "de", ["settings"], "nope")).toBeUndefined();
  });

  it("works for a locale with no files loaded at all", () => {
    expect(resolve(catalogs, "de", ["settings"], "save")).toBe("Save");
  });
});

describe("createTranslator", () => {
  it("interpolates the resolved string", () => {
    const t = createTranslator(
      { en: { settings: { greet: "Hello {{name}}" } } },
      "en",
      ["settings"],
    );
    expect(t("greet", { name: "Ada" })).toBe("Hello Ada");
  });

  it("renders a number as text", () => {
    const t = createTranslator(catalogs, "pl", ["settings"]);
    expect(t("count")).toBe("3");
  });

  it("takes a default string as the second argument", () => {
    const t = createTranslator(catalogs, "pl", ["settings"]);
    expect(t("missing.key", "Fallback")).toBe("Fallback");
  });

  it("renders an unknown key as itself, so it is visible and greppable", () => {
    const t = createTranslator(catalogs, "pl", ["settings"]);
    expect(t("missing.key")).toBe("missing.key");
  });

  it("searches `common` when asked for no namespace", () => {
    const t = createTranslator(catalogs, "en", []);
    expect(t("shared")).toBe("Shared");
  });
});

describe("plural forms", () => {
  const plural: CatalogsByLocale = {
    en: {
      common: { songs: "{{count}} songs", songs_one: "1 song", plain: "Plain" },
    },
    pl: {
      common: {
        songs: "Utwory: {{count}}",
        songs_one: "1 utwór",
        songs_few: "{{count}} utwory",
        songs_many: "{{count}} utworów",
      },
    },
  };

  it("picks the form the language's rules ask for", () => {
    const t = createTranslator(plural, "pl", ["common"]);
    expect(t("songs", { count: 1 })).toBe("1 utwór");
    expect(t("songs", { count: 3 })).toBe("3 utwory");
    expect(t("songs", { count: 5 })).toBe("5 utworów");
    expect(t("songs", { count: 22 })).toBe("22 utwory");
  });

  it("falls back to the bare key when a form is missing", () => {
    const t = createTranslator(plural, "pl", ["common"]);
    expect(t("songs", { count: 2.5 })).toBe("Utwory: 2.5");
  });

  it("uses English forms for English, and English rules for its fallback", () => {
    const en = createTranslator(plural, "en", ["common"]);
    expect(en("songs", { count: 1 })).toBe("1 song");
    expect(en("songs", { count: 4 })).toBe("4 songs");

    const de = createTranslator(plural, "de", ["common"]);
    expect(de("songs", { count: 1 })).toBe("1 song");
    expect(de("plain", { count: 7 })).toBe("Plain");
  });

  it("ignores a count that is not a number", () => {
    const t = createTranslator(plural, "pl", ["common"]);
    expect(t("songs", { count: "1" })).toBe("Utwory: 1");
  });
});
