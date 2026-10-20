import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { GiDrumKit } from "react-icons/gi";

import type { AutoBackingSummary } from "../generateAutoBacking";
import { useAutoBackingStore } from "../store/autoBackingStore";

/** Past this many chords the line stops being readable at a glance. */
const MAX_CHORDS = 8;

interface AutoBackingSectionProps {
  /** The section label style of the menu it sits in. */
  labelClassName: string;
  className?: string;
}

function useSummaryText(summary: AutoBackingSummary) {
  const { t } = useTranslation("session");
  const key = summary.key
    ? summary.key.scale
      ? t(`auto_backing.key.${summary.key.scale}`, { tonic: summary.key.tonic })
      : t("auto_backing.key.root", { tonic: summary.key.tonic })
    : null;
  const groove = t(`auto_backing.groove.${summary.groove}`);
  const chords =
    summary.chords.length > MAX_CHORDS
      ? `${summary.chords.slice(0, MAX_CHORDS).join(" – ")} …`
      : summary.chords.join(" – ");
  return { heading: [key, groove].filter(Boolean).join(" · "), chords };
}

function Summary({ summary }: { summary: AutoBackingSummary }) {
  const { t } = useTranslation("session");
  const { heading, chords } = useSummaryText(summary);
  return (
    <div className='mt-2.5 space-y-1'>
      <p className='text-[11px] font-semibold text-zinc-300'>{heading}</p>
      {summary.kind === "rhythm" ? (
        <p className='text-[10px] leading-relaxed text-zinc-500'>
          {t("auto_backing.drums_only")}
        </p>
      ) : (
        <p className='font-mono text-[11px] text-zinc-400'>{chords}</p>
      )}
      {summary.kind === "drone" && (
        <p className='text-[10px] leading-relaxed text-zinc-500'>
          {t("auto_backing.drone")}
        </p>
      )}
    </div>
  );
}

/**
 * The generated backing's switch, for the session's volume menu. Renders
 * nothing when the exercise on screen can't have one.
 */
export const AutoBackingSection = ({
  labelClassName,
  className,
}: AutoBackingSectionProps) => {
  const { t } = useTranslation("session");
  const available = useAutoBackingStore((state) => state.available);
  const summary = useAutoBackingStore((state) => state.summary);
  const enabled = useAutoBackingStore((state) => state.enabled);
  const setEnabled = useAutoBackingStore((state) => state.setEnabled);

  if (!available || !summary) return null;

  return (
    <div className={className}>
      <div className='flex items-center justify-between gap-3'>
        <span className={cn(labelClassName, "flex items-center gap-1.5")}>
          <GiDrumKit className='h-3 w-3' />
          {t("auto_backing.title")}
        </span>
        <Switch
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
          aria-label={t("auto_backing.toggle")}
        />
      </div>
      <Summary summary={summary} />
      <p className='mt-2 text-[10px] leading-relaxed text-zinc-500'>
        {enabled ? t("auto_backing.headphones") : t("auto_backing.description")}
      </p>
    </div>
  );
};
