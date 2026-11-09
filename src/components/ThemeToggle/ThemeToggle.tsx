import { useTranslation } from "hooks/useTranslation";
import { setColorTheme, useColorTheme } from "lib/colorTheme/colorTheme";
import { Moon, Sun } from "lucide-react";

/**
 * Header switch between the dark and the light app theme — the same choice as
 * Settings → Profile → Appearance, one click away. Shows what you switch *to*.
 */
export const ThemeToggle = () => {
  const { t } = useTranslation("settings");
  const theme = useColorTheme();
  const next = theme === "light" ? "dark" : "light";
  const Icon = next === "light" ? Sun : Moon;
  const label = `${t("appearance.title")}: ${t(`appearance.${next}`)}`;

  return (
    <button
      type='button'
      onClick={() => setColorTheme(next)}
      aria-label={label}
      title={label}
      className='flex h-11 min-w-11 items-center justify-center rounded-[8px] bg-white/5 px-2.5 text-zinc-300 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/20 hover:bg-white/10 hover:text-white'>
      <Icon className='h-[18px] w-[18px]' />
    </button>
  );
};
