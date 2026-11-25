import { PRESSABLE_KEY } from "assets/components/ui/button";
import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Headphones, Lock } from "lucide-react";

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
    <div role='group' aria-label={t("auto_backing.style.label")} className='flex flex-wrap gap-1.5'>
      {STYLE_CHOICES.map((choice) => {
        const active = choice === style;
        return (
          <button
            key={choice}
            type='button'
            onClick={() => setStyle(choice)}
            aria-pressed={active}
            className={cn(
              PRESSABLE_KEY,
              "h-8 rounded-lg px-2.5 text-xs transition-colors",
              // The band playing is green, as every picked switch in the session is.
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-zinc-800 font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100",
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
  );
}

/**
 * A session that brings its own band (a guild recording): the band is named,
 * and there is nothing to pick.
 */
function LockedStyle({ playing }: { playing: AutoBackingSummary["style"] }) {
  const { t } = useTranslation("session");
  return (
    <div>
      <p className='flex items-center gap-1.5 text-xs font-medium text-zinc-200'>
        <Lock className='h-3 w-3 text-zinc-500' aria-hidden />
        {t(`auto_backing.style.${playing}`)}
      </p>
      <p className='mt-1 text-xs leading-relaxed text-zinc-500'>
        {t("auto_backing.style.locked")}
      </p>
    </div>
  );
}

/** Past this many chords the line stops being readable at a glance. */
const MAX_CHORDS = 8;

interface AutoBackingSectionProps {
  /** The section heading style of the menu it sits in. */
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

/** What the band plays, on a quiet tile: key and groove, then the chords. */
function Summary({ summary }: { summary: AutoBackingSummary }) {
  const { t } = useTranslation("session");
  const { heading, chords } = useSummaryText(summary);
  return (
    <div className='space-y-1 rounded-lg bg-zinc-800/50 px-3 py-2.5'>
      <p className='text-xs font-semibold text-zinc-200'>{heading}</p>
      {summary.kind === "rhythm" ? (
        <p className='text-xs leading-relaxed text-zinc-500'>
          {t("auto_backing.drums_only")}
        </p>
      ) : (
        <p className='font-mono text-xs text-zinc-400'>{chords}</p>
      )}
    </div>
  );
}

/**
 * The generated band, for the session's backing menu: its switch, what it
 * plays and who plays it. Renders nothing when the exercise on screen can't
 * have one. Its volumes live in the menu's Mix, with every other channel.
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
  const styleLocked = useAutoBackingStore((state) => state.styleLocked);

  if (!available || !summary) return null;

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className='flex items-center justify-between gap-3'>
        <h4 className={labelClassName}>{t("auto_backing.style.label")}</h4>
        <Switch
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
          tone='emerald'
          aria-label={t("auto_backing.toggle")}
        />
      </div>
      {/* Shown off too: what the band would play is what decides whether to switch it on. */}
      <Summary summary={summary} />
      {enabled ? (
        <>
          {/* A boss fight plays its own score, whatever band was picked. */}
          {summary.groove !== "boss" &&
            (styleLocked ? (
              <LockedStyle playing={summary.style} />
            ) : (
              <StylePicker playing={summary.style} />
            ))}
          {/* The short form; the full reason (the mic hears the band as you) is
              one hover away for whoever wonders why. */}
          <p
            title={t("auto_backing.headphones")}
            className='flex items-center gap-2 text-xs text-zinc-500'>
            <Headphones className='h-3.5 w-3.5 shrink-0' aria-hidden />
            {t("auto_backing.headphones_short")}
          </p>
        </>
      ) : (
        <p className='text-xs leading-relaxed text-zinc-500'>
          {t("auto_backing.description")}
        </p>
      )}
    </section>
  );
};
