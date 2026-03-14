import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { convertMsToHM } from "utils/converter";

interface TimerData {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}

interface SavedTimeBannerProps {
  timerData: TimerData;
  onApply: () => void;
  onDismiss: () => void;
}

const SKILL_COLORS = {
  technique: "#e04c3b",
  theory: "#a44aed",
  hearing: "#4a7edd",
  creativity: "#37b874",
} as const;

const SavedTimeBanner = ({ timerData, onApply, onDismiss }: SavedTimeBannerProps) => {
  const { t } = useTranslation("report");

  const skills = [
    { key: "technique" as const, label: t("technique") },
    { key: "theory" as const, label: t("theory") },
    { key: "hearing" as const, label: t("hearing") },
    { key: "creativity" as const, label: t("creativity") },
  ];

  return (
    <div className="mb-6 rounded-xl  bg-cyan-500/5 p-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-cyan-400 mb-1.5">
            {t("toast.stoper_entered")}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
            {skills.map(
              ({ key, label }) =>
                timerData[key] > 0 && (
                  <span key={key} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SKILL_COLORS[key] }}
                    />
                    {label}:{" "}
                    <span className="font-bold text-white">
                      {convertMsToHM(timerData[key])}
                    </span>
                  </span>
                )
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button
            onClick={onApply}
          >
            Apply Time
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SavedTimeBanner;
