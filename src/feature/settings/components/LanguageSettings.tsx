import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { AppLocale } from "lib/i18n/locales";
import { SUPPORTED_LOCALES } from "lib/i18n/locales";
import { useSetLocale, useStoredLocale } from "lib/i18n/localeStore";
import { Check } from "lucide-react";

interface LocaleOptionProps {
  code: AppLocale;
  label: string;
  englishLabel: string;
  active: boolean;
  onSelect: (locale: AppLocale) => void;
}

const LocaleOption = ({
  code,
  label,
  englishLabel,
  active,
  onSelect,
}: LocaleOptionProps) => (
  <button
    type='button'
    lang={code}
    // The visible label is in its own language, so the accessible name carries the
    // English one too — a screen reader set to English still announces it.
    aria-label={englishLabel}
    aria-pressed={active}
    onClick={() => onSelect(code)}
    className={cn(
      "flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
      active
        ? "bg-cyan-500/10 text-cyan-300"
        : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900/70",
    )}>
    <span className='min-w-0 truncate'>{label}</span>
    {active && <Check className='h-4 w-4 shrink-0' />}
  </button>
);

/**
 * Settings → Profile. Picks the language the app is shown in.
 *
 * The choice is stored on this device and only applies inside the app — public
 * pages stay English (see `LocalizedRegion`). Translations land file by file, so
 * anything a language has not covered yet keeps showing the English string.
 */
export const LanguageSettings = () => {
  const { t } = useTranslation("settings");
  const locale = useStoredLocale();
  const setLocale = useSetLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("language.title")}</CardTitle>
        <CardDescription>{t("language.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {SUPPORTED_LOCALES.map(({ code, label, englishLabel }) => (
            <LocaleOption
              key={code}
              code={code}
              label={label}
              englishLabel={englishLabel}
              active={code === locale}
              onSelect={setLocale}
            />
          ))}
        </div>

        <p className='text-sm text-zinc-400'>{t("language.work_in_progress")}</p>
      </CardContent>
    </Card>
  );
};
