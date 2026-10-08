import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";
import type {
  LocaleCatalog,
  TranslationDict,
  TranslationNamespace,
} from "./namespaces";
import { DEFAULT_NAMESPACE, isTranslationNamespace } from "./namespaces";

export type CatalogsByLocale = Partial<Record<AppLocale, LocaleCatalog>>;

/** Values a namespace file may hold for a key we are allowed to render. */
type Translatable = string | number;

/**
 * Reads a dot path out of a namespace dict.
 *
 * Returns `undefined` both for a missing path and for one that lands on something
 * that is not text (an object, an array, `null`) — a parent node is not a
 * translation, and rendering it would put `[object Object]` on the screen.
 */
export function lookup(
  dict: TranslationDict | undefined,
  path: string,
): Translatable | undefined {
  if (!dict) return undefined;

  let node: unknown = dict;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    if (!(key in (node as Record<string, unknown>))) return undefined;
    node = (node as Record<string, unknown>)[key];
  }

  return typeof node === "string" || typeof node === "number"
    ? node
    : undefined;
}

/** Fills `{{name}}` placeholders. Unknown placeholders are left as they are. */
export function interpolate(
  text: string,
  vars?: Record<string, unknown>,
): string {
  if (!vars) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : match,
  );
}

/**
 * Splits a `namespace:some.key` reference. Keys without a known namespace prefix
 * are returned whole — `"guitarStartDate.save"` has no prefix, and a stray colon
 * inside a key must not be mistaken for one.
 */
export function splitKey(key: string): {
  namespace?: TranslationNamespace;
  path: string;
} {
  const separator = key.indexOf(":");
  if (separator === -1) return { path: key };

  const prefix = key.slice(0, separator);
  if (!isTranslationNamespace(prefix)) return { path: key };

  return { namespace: prefix, path: key.slice(separator + 1) };
}

const pluralRules = new Map<AppLocale, Intl.PluralRules>();

/** The CLDR plural category of `count` in `locale`: "one", "few", "many", "other"… */
export function pluralCategory(locale: AppLocale, count: number): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

/**
 * Resolves a key against the language chain: the active locale first, English
 * after it. Namespaces are tried in the order the caller listed them, each one
 * through the whole chain, so a namespace that owns the key in English wins over
 * a later namespace that happens to have it translated.
 *
 * With a `count`, each language first gets a chance at its own plural form —
 * `key_one`, `key_few`, `key_many`… picked by that language's rules, so Polish
 * can say "2 sesje" and "5 sesji" — and falls back to the bare key. A language
 * that does not need forms simply leaves them out.
 *
 * Returns `undefined` when nothing has the key, leaving the decision between a
 * caller-supplied default and the raw key to `createTranslator`.
 */
export function resolve(
  catalogs: CatalogsByLocale,
  locale: AppLocale,
  namespaces: readonly TranslationNamespace[],
  key: string,
  count?: number,
): Translatable | undefined {
  const { namespace, path } = splitKey(key);
  const chain: AppLocale[] =
    locale === DEFAULT_LOCALE ? [DEFAULT_LOCALE] : [locale, DEFAULT_LOCALE];
  const searched = namespace ? [namespace] : namespaces;

  for (const ns of searched) {
    for (const lang of chain) {
      const dict = catalogs[lang]?.[ns];
      if (count !== undefined) {
        const form = lookup(dict, `${path}_${pluralCategory(lang, count)}`);
        if (form !== undefined) return form;
      }
      const hit = lookup(dict, path);
      if (hit !== undefined) return hit;
    }
  }

  return undefined;
}

export type Translate = (
  key: string,
  options?: Record<string, unknown> | string,
) => string;

/**
 * Builds the `t` every component uses.
 *
 * The second argument is either interpolation variables or a default string —
 * both shapes are in use across the app, so both keep working. A numeric
 * `count` among the variables also picks the plural form (see `resolve`). A key that
 * resolves nowhere renders as itself: a visible, greppable `settings.title`
 * beats an empty space.
 */
export function createTranslator(
  catalogs: CatalogsByLocale,
  locale: AppLocale,
  namespaces: readonly TranslationNamespace[],
): Translate {
  const searched = namespaces.length ? namespaces : [DEFAULT_NAMESPACE];

  return (key, options) => {
    const vars =
      typeof options === "object" && options !== null ? options : undefined;
    const defaultValue = typeof options === "string" ? options : undefined;

    const count =
      typeof vars?.count === "number" && Number.isFinite(vars.count)
        ? vars.count
        : undefined;
    const hit = resolve(catalogs, locale, searched, key, count);
    if (hit !== undefined) return interpolate(String(hit), vars);

    return defaultValue ?? key;
  };
}

/**
 * For copy built outside a component (content modules, utils) that keeps its
 * English inline: with a translator the key is looked up, and a key nobody has
 * (not even the English catalog) falls back to the inline English. Without one
 * — tests, server code — the inline English is used as is.
 */
export function translateOr(
  t: Translate | undefined,
  key: string,
  english: string,
  vars?: Record<string, unknown>,
): string {
  if (!t) return interpolate(english, vars);
  const hit = t(key, vars);
  return hit === key ? interpolate(english, vars) : hit;
}
