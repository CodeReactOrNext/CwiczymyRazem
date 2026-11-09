import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { GiDrumKit } from "react-icons/gi";

import type { AutoBackingSummary } from "../generateAutoBacking";
import { useAutoBackingStore } from "../store/autoBackingStore";
import type { BandStylePreference } from "../styles";
import { BAND_STYLES } from "../styles";

const STYLE_CHOICES: readonly BandStylePreference[] = ["auto", ...BAND_STYLES];

/**
 * Who plays the backing: "Auto" lets each exercise pick its band, the rest
 * put the same band on every exercise. Auto names the band it picked.
 */
function StylePicker({ playing }: { playing: AutoBackingSummary["style"] }) {
  const { t } = useTranslation("session");
  const style = useAutoBackingStore((state) => state.style);
  const setStyle = useAutoBackingStore((state) => state.setStyle);
  return (
    <div className='mt-3'>
      <p className='text-[10px] text-zinc-500'>
        {t("auto_backing.style.label")}
      </p>
      <div className='mt-1.5 flex flex-wrap gap-1'>
        {STYLE_CHOICES.map((choice) => {
          const active = choice === style;
          return (
            <button
              key={choice}
              type='button'
              onClick={() => setStyle(choice)}
              aria-pressed={active}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "bg-white/[0.03] text-zinc-500 hover:text-zinc-300",
              )}>
              {choice === "auto"
                ? t("auto_backing.style.auto", {
                    style: t(`auto_backing.style.${playing}`),
                  })
                : t(`auto_backing.style.${choice}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
      {/* A boss fight plays its own score, whatever band was picked. */}
      {enabled && summary.groove !== "boss" && (
        <StylePicker playing={summary.style} />
      )}
      <p className='mt-2 text-[10px] leading-relaxed text-zinc-500'>
        {enabled ? t("auto_backing.headphones") : t("auto_backing.description")}
      </p>
    </div>
  );
};
