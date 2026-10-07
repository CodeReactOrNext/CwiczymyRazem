import type { Locale } from "date-fns";
import { de } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es";
import { pl } from "date-fns/locale/pl";
import { useActiveLocale } from "lib/i18n/LocalizedRegion";

import type { AppLocale } from "./locales";

const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  en: enUS,
  pl,
  de,
  es,
};

/** The date-fns locale for an app language — month names, "2 hours ago" and so on. */
export const getDateFnsLocale = (locale: AppLocale): Locale =>
  DATE_FNS_LOCALES[locale];

/** date-fns locale of the language the current tree renders in. */
export const useDateFnsLocale = (): Locale => getDateFnsLocale(useActiveLocale());

/**
 * BCP 47 tag for `Intl` / `toLocaleDateString`. English keeps the browser's own
 * region (en-GB vs en-US date order); other languages use theirs.
 */
export const useIntlLocale = (): string | undefined => {
  const locale = useActiveLocale();
  return locale === "en" ? undefined : locale;
};
