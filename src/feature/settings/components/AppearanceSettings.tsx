import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { ColorTheme } from "lib/colorTheme/colorTheme";
import { setColorTheme, useColorTheme } from "lib/colorTheme/colorTheme";
import { Check, Moon, Sun } from "lucide-react";

const OPTIONS: { value: ColorTheme; Icon: typeof Moon }[] = [
  { value: "dark", Icon: Moon },
  { value: "light", Icon: Sun },
];

/**
 * Settings → Profile. Dark or light app, stored on this device. Public pages
 * (landing, blog) stay dark either way — see lib/colorTheme.
 */
export const AppearanceSettings = () => {
  const { t } = useTranslation("settings");
  const theme = useColorTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("appearance.title")}</CardTitle>
        <CardDescription>{t("appearance.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3 sm:max-w-md'>
          {OPTIONS.map(({ value, Icon }) => {
            const active = value === theme;
            return (
              <button
                key={value}
                type='button'
                aria-pressed={active}
                onClick={() => setColorTheme(value)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
                  active
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900/70",
                )}>
                <span className='flex min-w-0 items-center gap-2'>
                  <Icon className='h-4 w-4 shrink-0' />
                  <span className='truncate'>{t(`appearance.${value}`)}</span>
                </span>
                {active && <Check className='h-4 w-4 shrink-0' />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
