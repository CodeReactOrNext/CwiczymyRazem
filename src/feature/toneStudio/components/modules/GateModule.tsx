import { Faceplate } from "feature/toneStudio/components/Faceplate";
import { InputMeter } from "feature/toneStudio/components/InputMeter";
import { PedalFace } from "feature/toneStudio/components/PedalFace";
import { BypassSwitch } from "feature/toneStudio/components/PluginChrome";
import { GATE_PEDAL_SRC } from "feature/toneStudio/utils/gearArt";
import { useTranslation } from "hooks/useTranslation";
import type { AmpParams } from "types/nativeAudio";

interface GateModuleProps {
  params: AmpParams;
  set: (patch: Partial<AmpParams>) => void;
}

/**
 * First unit in the chain. It has no threshold to dial, so the pedal is a real
 * one-switch utility box and its panel stays bare — the space goes to the input
 * meter instead, which is what you actually look at while deciding whether the
 * gate needs to be in at all.
 */
export const GateModule = ({ params, set }: GateModuleProps) => {
  const { t } = useTranslation("tone_studio");

  return (
  <Faceplate
    accent='cyan'
    title={t("gate.title")}
    subtitle={t("gate.subtitle")}
    bypassed={!params.gate}
    headerRight={
      <BypassSwitch
        active={params.gate}
        accent='cyan'
        onToggle={() => set({ gate: !params.gate })}
      />
    }
    contentClassName='items-center justify-center gap-8 sm:flex-row'>
    <PedalFace
      src={GATE_PEDAL_SRC}
      accent='cyan'
      engaged={params.gate}
      onToggle={() => set({ gate: !params.gate })}
      className='w-[38%] max-w-[190px]'
    />

    <div className='flex min-w-0 flex-1 flex-col gap-5'>
      <div>
        <InputMeter size='lg' showLabel={false} />
        <p className='mt-2 text-[11px] text-zinc-500'>
          {t("gate.input_hint")}
        </p>
      </div>
      <p className='text-sm leading-relaxed text-zinc-400'>
        {t("gate.body")}
      </p>
    </div>
  </Faceplate>
  );
};
