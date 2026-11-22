import { Button } from "assets/components/ui/button";
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
    <Button
      type='button'
      variant='subtle'
      size='icon-touch'
      onClick={() => setColorTheme(next)}
      aria-label={label}
      title={label}>
      <Icon />
    </Button>
  );
};
