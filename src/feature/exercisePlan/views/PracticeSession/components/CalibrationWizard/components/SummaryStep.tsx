import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check } from "lucide-react";
import React from "react";

import { CloseButton } from "./CloseButton";

export interface SetupSummary {
  /** Strings ticked off in the tuning step; null when it was skipped as already tuned. */
  tunedCount: number | null;
  stringCount: number;
  /** The timing latency in use now, and whether it was measured or is the estimate. */
  latencyMs: number;
  latencyMeasured: boolean;
}

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 rounded-lg bg-zinc-900/60 px-4 py-3">
    <span className="text-sm text-zinc-400">{label}</span>
    <span className={cn("text-sm font-semibold text-right", muted ? "text-zinc-400" : "text-zinc-100")}>{value}</span>
  </div>
);

/** The wrap-up: the mic is on, here is what was set. Closing it any way keeps that. */
export const SummaryStep = React.memo(function SummaryStep({
  summary, onConfirm,
}: {
  summary:   SetupSummary;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("calibration");
  const { tunedCount, stringCount, latencyMs, latencyMeasured } = summary;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 text-white sm:px-12 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">{t("summary.title")}</h2>
        <CloseButton onClick={onConfirm} label={t("close")} />
      </div>

      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-6 w-6 text-emerald-400" />
        </span>
        <div>
          <p className="font-bold text-white">{t("summary.ready")}</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{t("summary.body")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Row
          label={t("summary.tuning")}
          value={tunedCount === null
            ? t("summary.tuning_skipped")
            : t("summary.tuning_count", { tuned: tunedCount, total: stringCount })}
          muted={tunedCount === null}
        />
        <Row
          label={t("summary.latency")}
          value={latencyMeasured
            ? t("summary.latency_measured", { ms: latencyMs })
            : t("summary.latency_estimate", { ms: latencyMs })}
          muted={!latencyMeasured}
        />
      </div>

      {!latencyMeasured && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">{t("summary.latency_later")}</p>
      )}

      <Button onClick={onConfirm} className="mt-8 h-12 w-full font-bold">
        {t("summary.start")}
      </Button>
    </div>
  );
});
