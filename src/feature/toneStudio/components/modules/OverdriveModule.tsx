import { Faceplate } from "feature/toneStudio/components/Faceplate";
import { PedalFace } from "feature/toneStudio/components/PedalFace";
import { BypassSwitch } from "feature/toneStudio/components/PluginChrome";
import { OVERDRIVE_PEDAL_SRC } from "feature/toneStudio/utils/gearArt";
import type { AmpParams } from "types/nativeAudio";

interface OverdriveModuleProps {
  params: AmpParams;
  set: (patch: Partial<AmpParams>) => void;
}

/** The stompbox in front of the amp — three knobs, no menus, like the real thing. */
export const OverdriveModule = ({ params, set }: OverdriveModuleProps) => (
  <Faceplate
    accent='orange'
    title='Overdrive'
    bypassed={!params.overdriveEnabled}
    headerRight={
      <BypassSwitch
        active={params.overdriveEnabled}
        accent='orange'
        onToggle={() => set({ overdriveEnabled: !params.overdriveEnabled })}
      />
    }
    contentClassName='items-center justify-center'>
    <PedalFace
      src={OVERDRIVE_PEDAL_SRC}
      accent='orange'
      engaged={params.overdriveEnabled}
      onToggle={() => set({ overdriveEnabled: !params.overdriveEnabled })}
      className='w-full max-w-[340px]'
      knobs={[
        {
          label: "Drive",
          accent: "orange",
          value: params.overdriveDrive,
          defaultValue: 0.5,
          onChange: (v) => set({ overdriveDrive: v }),
        },
        {
          label: "Tone",
          accent: "orange",
          value: params.overdriveTone,
          defaultValue: 0.5,
          onChange: (v) => set({ overdriveTone: v }),
        },
        {
          label: "Level",
          accent: "orange",
          value: params.overdriveLevel,
          defaultValue: 0.5,
          onChange: (v) => set({ overdriveLevel: v }),
        },
      ]}
    />
  </Faceplate>
);
