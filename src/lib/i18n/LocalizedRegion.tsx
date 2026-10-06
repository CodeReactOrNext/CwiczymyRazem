import { createContext, useContext, useEffect } from "react";

import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";
import { useStoredLocale } from "./localeStore";

const LocalizedRegionContext = createContext(false);

/**
 * Marks the part of the product the language choice applies to: the logged-in
 * app. Everything outside it — the landing page, the blog, the public song
 * guides, every SEO page — stays in English on purpose. Those pages are indexed
 * in one language and are rendered on the server, where there is no choice to
 * read, so swapping their copy per device would mean serving one language to the
 * crawler and another to the reader.
 *
 * Mounted once, in the logged-in shell (`MainLoggedLayout`).
 */
export const LocalizedRegion = ({ children }: { children: React.ReactNode }) => {
  const locale = useStoredLocale();

  // Screen readers and the browser's own translation prompt go by `<html lang>`,
  // which `_document` pins to English for the public pages.
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = DEFAULT_LOCALE;
    };
  }, [locale]);

  return (
    <LocalizedRegionContext.Provider value={true}>
      {children}
    </LocalizedRegionContext.Provider>
  );
};

/** Whether the tree being rendered is inside the app rather than on a public page. */
export const useIsLocalizedRegion = (): boolean =>
  useContext(LocalizedRegionContext);

/**
 * Locale the current tree should actually render in — the stored choice inside
 * the app, English everywhere else.
 */
export function useActiveLocale(): AppLocale {
  const stored = useStoredLocale();
  return useIsLocalizedRegion() ? stored : DEFAULT_LOCALE;
}
