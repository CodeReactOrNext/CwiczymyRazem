import { Button } from "assets/components/ui/button";
import { useIsLandscape } from "hooks/useIsLandscape";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useResponsiveStore } from "store/useResponsiveStore";

import { CloseButton } from "./CloseButton";

export type InputSource = "interface" | "microphone";

interface SourceStepProps {
  onSelect: (source: InputSource) => void;
  onCancel: () => void;
}

const Header = ({ title, onCancel, closeLabel }: { title: string; onCancel: () => void; closeLabel: string }) => (
  <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8 shortwide:mb-3">
    <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
    <CloseButton onClick={onCancel} label={closeLabel} />
  </div>
);

/** One way in, pictured: the picture says what the title means at a glance. */
function SourceCard({
  image, title, description, onClick,
}: {
  image: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-6 rounded-lg bg-zinc-900/40 px-6 py-8 transition-colors hover:bg-zinc-800/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
    >
      <div className="relative h-36 w-full">
        <Image src={image} alt="" fill sizes="300px" className="select-none object-contain" draggable={false} />
      </div>
      <div className="space-y-1.5 text-center">
        <p className="text-base font-semibold text-zinc-100">{title}</p>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
    </button>
  );
}

/**
 * On a phone the guitar can only reach the app through the mic, so there is
 * nothing to choose — the step is just the one tip that matters there:
 * headphones, so the mic doesn't hear the app's own sound.
 */
const MobileMicSource = ({ onSelect, onCancel }: SourceStepProps) => {
  const { t } = useTranslation("calibration");
  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <Header title={t("source.title")} onCancel={onCancel} closeLabel={t("close")} />

      <div className="flex flex-col items-center gap-6 rounded-lg bg-zinc-900/40 px-5 py-8 text-center shortwide:flex-row shortwide:gap-8 shortwide:px-8 shortwide:py-5 shortwide:text-left">
        <div className="relative h-40 w-full shortwide:h-32 shortwide:w-40 shortwide:shrink-0">
          <Image src="/images/setup/headphones.webp" alt="" fill sizes="240px" className="select-none object-contain" draggable={false} priority />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-zinc-100">{t("source.mobile_headphones")}</p>
          <p className="text-sm leading-relaxed text-zinc-400">{t("source.mobile_headphones_body")}</p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-400 shortwide:mt-3">{t("source.mobile_body")}</p>

      <div className="mt-auto flex justify-end pt-8 shortwide:pt-4">
        <Button onClick={() => onSelect("microphone")} className="h-12 w-full gap-2 px-6 text-base font-semibold sm:h-11 sm:w-auto">
          {t("source.continue")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const SourceStep = ({ onSelect, onCancel }: SourceStepProps) => {
  const { t } = useTranslation("calibration");
  const isMobile = useResponsiveStore((state) => state.isMobile);
  // A phone held sideways is wider than the mobile breakpoint, but it is still a phone.
  const isPhoneSideways = useIsLandscape();
  if (isMobile || isPhoneSideways) return <MobileMicSource onSelect={onSelect} onCancel={onCancel} />;
  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <Header title={t("source.title")} onCancel={onCancel} closeLabel={t("close")} />

      <p className="mb-6 text-base text-zinc-300">{t("source.question")}</p>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <SourceCard
          image="/images/setup/interface.webp"
          title={t("source.interface")}
          description={t("source.interface_desc")}
          onClick={() => onSelect("interface")}
        />
        <SourceCard
          image="/images/setup/microphone.webp"
          title={t("source.mic")}
          description={t("source.mic_desc")}
          onClick={() => onSelect("microphone")}
        />
      </div>

    </div>
  );
};
