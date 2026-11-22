import { Card } from "assets/components/ui/card";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { useTranslation } from "hooks/useTranslation";
import type { ColorTheme } from "lib/colorTheme/colorTheme";
import { setColorTheme, useColorTheme } from "lib/colorTheme/colorTheme";
import { Moon, Sun } from "lucide-react";

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
      <SectionHeader title={t("appearance.title")} description={t("appearance.subtitle")} />
      <div>
        <SegmentedControl<ColorTheme>
          label={t("appearance.title")}
          selected={[theme]}
          onSelect={setColorTheme}
          options={OPTIONS.map(({ value, Icon }) => ({
            value,
            label: t(`appearance.${value}`),
            icon: <Icon className='h-4 w-4 shrink-0' />,
          }))}
        />
      </div>
    </Card>
  );
};
