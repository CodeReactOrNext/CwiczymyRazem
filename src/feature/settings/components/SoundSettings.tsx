import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Switch } from "assets/components/ui/switch";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { useUiSoundsStore } from "lib/uiSounds/uiSoundsStore";

/**
 * Settings → Profile. Turns the app's own UI sounds on or off on this device
 * (see `lib/uiSounds`). Switching them on plays one, so the choice is heard.
 */
export const SoundSettings = () => {
  const { t } = useTranslation("settings");
  const enabled = useUiSoundsStore((s) => s.enabled);
  const setEnabled = useUiSoundsStore((s) => s.setEnabled);

  const toggle = () => {
    setEnabled(!enabled);
    if (!enabled) playUiSound("reward");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sounds.title")}</CardTitle>
        <CardDescription>{t("sounds.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between gap-6 rounded-lg bg-zinc-900/40 px-4 py-3'>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-200'>
              {t("sounds.label")}
            </p>
            <p className='mt-1 text-sm text-zinc-400'>
              {t("sounds.description")}
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={toggle}
            aria-label={t("sounds.label")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
