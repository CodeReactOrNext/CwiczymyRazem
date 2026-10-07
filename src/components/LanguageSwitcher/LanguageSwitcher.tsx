import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { AppLocale } from "lib/i18n/locales";
import { SUPPORTED_LOCALES } from "lib/i18n/locales";
import { useSetLocale, useStoredLocale } from "lib/i18n/localeStore";
import { Check } from "lucide-react";

/**
 * Flags drawn as SVG: Windows renders flag emoji as two bare letters, which is
 * exactly the platform most players are on.
 */
const Flag = ({ locale, className }: { locale: AppLocale; className?: string }) => {
  const box = cn("h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]", className);
  switch (locale) {
    case "pl":
      return (
        <svg viewBox='0 0 20 14' className={box} aria-hidden>
          <rect width='20' height='7' fill='#fff' />
          <rect y='7' width='20' height='7' fill='#dc143c' />
        </svg>
      );
    case "de":
      return (
        <svg viewBox='0 0 20 14' className={box} aria-hidden>
          <rect width='20' height='4.67' fill='#000' />
          <rect y='4.67' width='20' height='4.67' fill='#dd0000' />
          <rect y='9.33' width='20' height='4.67' fill='#ffce00' />
        </svg>
      );
    case "es":
      return (
        <svg viewBox='0 0 20 14' className={box} aria-hidden>
          <rect width='20' height='14' fill='#aa151b' />
          <rect y='3.5' width='20' height='7' fill='#f1bf00' />
        </svg>
      );
    default:
      return (
        <svg viewBox='0 0 60 42' className={box} aria-hidden>
          <rect width='60' height='42' fill='#012169' />
          <path d='M0 0 60 42M60 0 0 42' stroke='#fff' strokeWidth='8' />
          <path d='M0 0 60 42M60 0 0 42' stroke='#c8102e' strokeWidth='3' />
          <path d='M30 0v42M0 21h60' stroke='#fff' strokeWidth='12' />
          <path d='M30 0v42M0 21h60' stroke='#c8102e' strokeWidth='7' />
        </svg>
      );
  }
};

/** Header language picker — the same choice as in Settings, one click away. */
export const LanguageSwitcher = () => {
  const locale = useStoredLocale();
  const setLocale = useSetLocale();
  const { t } = useTranslation("nav");
  const current = SUPPORTED_LOCALES.find((entry) => entry.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${current?.englishLabel ?? "English"}`}
        className='flex h-9 items-center justify-center rounded-[8px] bg-white/5 px-2.5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/20 hover:bg-white/10'>
        <Flag locale={locale} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[10rem]'>
        {SUPPORTED_LOCALES.map(({ code, label, englishLabel }) => (
          <DropdownMenuItem
            key={code}
            aria-label={englishLabel}
            onSelect={() => setLocale(code)}
            className='flex cursor-pointer items-center gap-2.5'>
            <Flag locale={code} />
            <span className='flex-1'>{label}</span>
            {code === locale && <Check className='h-4 w-4 text-cyan-400' />}
          </DropdownMenuItem>
        ))}
        <p className='max-w-[12rem] px-2 pb-1.5 pt-2 text-[11px] leading-snug text-zinc-500'>
          {t("language_wip")}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
