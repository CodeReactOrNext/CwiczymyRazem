import { Faceplate } from "feature/toneStudio/components/Faceplate";
import { PedalFace } from "feature/toneStudio/components/PedalFace";
import { BypassSwitch } from "feature/toneStudio/components/PluginChrome";
import { DELAY_PEDAL_SRC } from "feature/toneStudio/utils/gearArt";
import type { AmpParams } from "types/nativeAudio";

/** Full-scale delay time in ms — the knob's 0..1 maps onto this range. */
const MAX_DELAY_MS = 800;

interface DelayModuleProps {
  params: AmpParams;
  set: (patch: Partial<AmpParams>) => void;
}

/** Post-cabinet delay — the last box in the chain. */
export const DelayModule = ({ params, set }: DelayModuleProps) => (
  <Faceplate
    accent='amber'
    title='Delay'
    bypassed={!params.delayEnabled}
    headerRight={
      <BypassSwitch
        active={params.delayEnabled}
        accent='amber'
        onToggle={() => set({ delayEnabled: !params.delayEnabled })}
      />
    }
    contentClassName='items-center justify-center'>
    <PedalFace
      src={DELAY_PEDAL_SRC}
      accent='amber'
      engaged={params.delayEnabled}
      onToggle={() => set({ delayEnabled: !params.delayEnabled })}
      className='w-full max-w-[340px]'
      knobs={[
        {
          label: "Time",
          accent: "amber",
          value: params.delayMs / MAX_DELAY_MS,
          defaultValue: 400 / MAX_DELAY_MS,
          displayValue: `${Math.round(params.delayMs)}ms`,
          onChange: (v) => set({ delayMs: v * MAX_DELAY_MS }),
        },
        {
          label: "Feedback",
          accent: "amber",
          value: params.delayFeedback,
          defaultValue: 0.35,
          onChange: (v) => set({ delayFeedback: v }),
        },
        {
          label: "Mix",
          accent: "amber",
          value: params.delayMix,
          defaultValue: 0.3,
          onChange: (v) => set({ delayMix: v }),
        },
      ]}
    />
  </Faceplate>
);
