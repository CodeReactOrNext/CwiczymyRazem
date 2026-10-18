import { cn } from "assets/lib/utils";
import { AMP_HEAD_SRC } from "feature/toneStudio/utils/gearArt";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";
import type { AmpParams } from "types/nativeAudio";

interface ToneModeChooserProps {
  onChoose: (mode: AmpParams["toneMode"]) => void;
}

/** Three numbered units patched in a row — the VST rack, drawn small. */
const RackGlyph = () => (
  <div aria-hidden className='flex items-center gap-1.5'>
    {["01", "02", "03"].map((n, i) => (
      <div key={n} className='flex items-center gap-1.5'>
        {i > 0 && <span className='h-0.5 w-3 rounded-full bg-zinc-700' />}
        <div className='flex h-20 w-16 flex-col justify-between rounded-lg bg-zinc-800/80 p-2'>
          <span className='font-teko text-xl leading-none text-zinc-400'>
            {n}
          </span>
          <span className='flex flex-col gap-1'>
            <span className='h-1 w-full rounded-full bg-zinc-600' />
            <span className='h-1 w-2/3 rounded-full bg-zinc-700' />
          </span>
        </div>
      </div>
    ))}
  </div>
);

interface OptionProps {
  title: string;
  body: string;
  inside: string;
  art: ReactNode;
  onClick: () => void;
}

const Option = ({ title, body, inside, art, onClick }: OptionProps) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      "group flex flex-col gap-5 rounded-lg bg-zinc-900/60 p-5 text-left transition-colors sm:p-6",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/60",
    )}>
    <div className='flex h-36 items-center justify-center overflow-hidden rounded-lg bg-zinc-950/60 px-6'>
      {art}
    </div>
    <div className='flex flex-col gap-2'>
      <span className='font-display text-lg font-semibold text-zinc-100'>
        {title}
      </span>
      <span className='text-sm leading-relaxed text-zinc-400'>{body}</span>
    </div>
    <span className='mt-auto text-xs text-zinc-500 group-hover:text-zinc-400'>
      {inside}
    </span>
  </button>
);

/**
 * The first thing Tone Studio asks on a machine that can host plugins: play
 * through the built-in chain, or build a rack out of your own VST3 plugins.
 * Two worlds, not two tabs — each has its own screen afterwards, and the top
 * rail can switch between them at any time.
 */
export const ToneModeChooser = ({ onChoose }: ToneModeChooserProps) => {
  const { t } = useTranslation("tone_studio");

  return (
    <div className='relative px-4 py-10 sm:px-8 sm:py-14'>
      <div className='mx-auto flex max-w-xl flex-col gap-2 text-center'>
        <h2 className='font-display text-2xl font-semibold text-zinc-100'>
          {t("mode.choose_title")}
        </h2>
        <p className='text-sm text-zinc-400'>{t("mode.choose_hint")}</p>
      </div>
      <div className='mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2'>
        <Option
          title={t("mode.builtin_title")}
          body={t("mode.builtin_body")}
          inside={t("mode.builtin_inside")}
          onClick={() => onChoose("builtin")}
          art={
            <img
              src={AMP_HEAD_SRC}
              alt=''
              draggable={false}
              className='w-full max-w-[260px] select-none'
            />
          }
        />
        <Option
          title={t("mode.vst_title")}
          body={t("mode.vst_body")}
          inside={t("mode.vst_inside")}
          onClick={() => onChoose("vst")}
          art={<RackGlyph />}
        />
      </div>
    </div>
  );
};
