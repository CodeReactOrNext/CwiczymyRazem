import { useActiveLocale } from "lib/i18n/LocalizedRegion";
import { loadNamespaces, useCatalogs, useSetLocale } from "lib/i18n/localeStore";
import type { AppLocale } from "lib/i18n/locales";
import { normalizeLocale } from "lib/i18n/locales";
import type { TranslationNamespace } from "lib/i18n/namespaces";
import { DEFAULT_NAMESPACE, isTranslationNamespace } from "lib/i18n/namespaces";
import type { Translate } from "lib/i18n/translate";
import { createTranslator } from "lib/i18n/translate";
import { useEffect, useMemo } from "react";

export type { TranslationNamespace } from "lib/i18n/namespaces";

interface UseTranslationResult {
  t: Translate;
  i18n: {
    language: AppLocale;
    changeLanguage: (locale: string) => Promise<void>;
  };
}

/**
 * Component-facing translation hook — the same shape `react-i18next` had, so call
 * sites never had to change.
 *
 * English is bundled, so `t` always returns something on the first render. For any
 * other language the overlay files for the namespaces asked for here are fetched
 * once and the component re-renders with whatever they translate; the rest stays
 * English. See `lib/i18n/locales.ts`.
 */
export function useTranslation(
  namespace?: TranslationNamespace | TranslationNamespace[],
): UseTranslationResult {
  const locale = useActiveLocale();
  const catalogs = useCatalogs();
  const setLocale = useSetLocale();

  // Most call sites pass the namespaces as an inline array literal, which is a new
  // array on every render. Keying the list by its joined form keeps `t` and the
  // loader below stable instead of rebuilding (and re-fetching) on each render.
  const namespaceKey = Array.isArray(namespace)
    ? namespace.join(",")
    : (namespace ?? DEFAULT_NAMESPACE);

  const namespaces = useMemo(() => {
    // Filtered rather than cast: an unknown name here would otherwise become a
    // request for a namespace file that cannot exist.
    const names = namespaceKey.split(",").filter(isTranslationNamespace);
    return names.length ? names : [DEFAULT_NAMESPACE];
  }, [namespaceKey]);

  useEffect(() => {
    loadNamespaces(locale, namespaces);
  }, [locale, namespaces]);

  const t = useMemo(
    () => createTranslator(catalogs, locale, namespaces),
    [catalogs, locale, namespaces],
  );

  const i18n = useMemo(
    () => ({
      language: locale,
      changeLanguage: (next: string) => {
        setLocale(normalizeLocale(next));
        return Promise.resolve();
      },
    }),
    [locale, setLocale],
  );

  return { t, i18n };
}
