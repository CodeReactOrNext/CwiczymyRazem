import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE, normalizeLocale } from "./locales";
import type { TranslationDict, TranslationNamespace } from "./namespaces";
import { EN_CATALOG } from "./namespaces";
import type { CatalogsByLocale } from "./translate";

interface LocaleState {
  /** The player's chosen language. English until they pick another one. */
  locale: AppLocale;
  /** Everything loaded so far, English included (bundled, never fetched). */
  catalogs: CatalogsByLocale;
  setLocale: (locale: AppLocale) => void;
}

/**
 * Chosen language, persisted per device — like handedness, and unlike anything
 * that belongs on the account. Nothing server-side depends on it: the app is
 * rendered in English and the overlay is applied in the browser.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      catalogs: { en: EN_CATALOG },
      setLocale: (locale) => set({ locale: normalizeLocale(locale) }),
    }),
    {
      name: "riffquest-locale",
      version: 1,
      // Only the choice is worth storing — the catalogs are either bundled or
      // re-fetched, and keeping them would blow up localStorage for nothing.
      partialize: ({ locale }) => ({ locale }),
      // A language this build no longer has (or a hand-edited value) must not
      // leave the app looking up namespaces that cannot resolve.
      merge: (persisted, current) => ({
        ...current,
        locale: normalizeLocale((persisted as { locale?: unknown } | null)?.locale),
      }),
    },
  ),
);

/** In-flight (or settled) fetches, so a namespace is never requested twice. */
const requested = new Set<string>();

async function fetchNamespace(
  locale: AppLocale,
  namespace: TranslationNamespace,
): Promise<void> {
  const token = `${locale}/${namespace}`;
  if (requested.has(token)) return;
  requested.add(token);

  // A missing file is not an error: that language simply has no overlay for this
  // namespace yet, and every key falls back to English. It is still stored as `{}`
  // so the same file is not asked for again.
  let dict: TranslationDict = {};
  try {
    const response = await fetch(`/locales/${locale}/${namespace}.json`);
    if (response.ok) dict = (await response.json()) as TranslationDict;
  } catch {
    // Offline, or the request died in flight. Nothing is stored and the token is
    // released, so the next component asking for this namespace tries again.
    requested.delete(token);
    return;
  }

  useLocaleStore.setState((state) => ({
    catalogs: {
      ...state.catalogs,
      [locale]: { ...state.catalogs[locale], [namespace]: dict },
    },
  }));
}

/**
 * Makes sure the overlay files for these namespaces are on their way.
 *
 * Called from render effects, so it has to be cheap and idempotent: English needs
 * nothing, anything already loaded needs nothing, and the rest is fetched once.
 */
export function loadNamespaces(
  locale: AppLocale,
  namespaces: readonly TranslationNamespace[],
): void {
  if (locale === DEFAULT_LOCALE || typeof window === "undefined") return;

  const loaded = useLocaleStore.getState().catalogs[locale];
  for (const namespace of namespaces) {
    if (!loaded?.[namespace]) void fetchNamespace(locale, namespace);
  }
}

const subscribeLocale = (onChange: () => void) => useLocaleStore.subscribe(onChange);

const getLocaleSnapshot = () => useLocaleStore.getState().locale;

/** The server renders every page in the source language — it has no localStorage. */
const getServerLocaleSnapshot = (): AppLocale => DEFAULT_LOCALE;

/**
 * The stored language choice. English through hydration so the markup React
 * renders on the server matches the one it hydrates, then the real choice on the
 * render straight after — the same shape as `useIsLeftHanded`.
 */
export function useStoredLocale(): AppLocale {
  return useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );
}

export const useCatalogs = (): CatalogsByLocale =>
  useLocaleStore((state) => state.catalogs);

export const useSetLocale = (): ((locale: AppLocale) => void) =>
  useLocaleStore((state) => state.setLocale);
