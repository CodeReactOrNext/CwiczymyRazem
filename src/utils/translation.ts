import type { AppLocale } from "lib/i18n/locales";
import { normalizeLocale } from "lib/i18n/locales";
import { useLocaleStore } from "lib/i18n/localeStore";
import { DEFAULT_NAMESPACE } from "lib/i18n/namespaces";
import type { Translate } from "lib/i18n/translate";
import { createTranslator } from "lib/i18n/translate";

/**
 * Translation for code that runs outside React — toasts, redux slices, services.
 *
 * Same resolution as the `useTranslation` hook (`lib/i18n/translate`), read from
 * the same store, so a player on Polish gets Polish toasts. It cannot subscribe to
 * anything, so the locale is read per call: these are one-shot strings produced at
 * the moment something happens, not rendered output that has to re-run on change.
 *
 * Keys are namespaced (`"toast:something"`); anything unprefixed is looked up in
 * `common`.
 */
const t: Translate = (key, options) => {
  const { locale, catalogs } = useLocaleStore.getState();
  return createTranslator(catalogs, locale, [DEFAULT_NAMESPACE])(key, options);
};

export const i18n = {
  t,
  get language(): AppLocale {
    return useLocaleStore.getState().locale;
  },
  changeLanguage: (next: string) => {
    useLocaleStore.getState().setLocale(normalizeLocale(next));
    return Promise.resolve();
  },
};
