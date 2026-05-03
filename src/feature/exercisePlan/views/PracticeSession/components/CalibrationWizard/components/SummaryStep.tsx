import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

import type { CalibrationOffsets } from "../../../hooks/useCalibration";
import { STRINGS } from "../calibration.constants";

export const SummaryStep = React.memo(function SummaryStep({
  offsets, onConfirm, onCancel,
}: {
  offsets:   CalibrationOffsets;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">All Done</h2>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full overflow-y-auto">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="flex justify-center pt-2 pb-1"
        >
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <FaCheck className="h-6 w-6 text-emerald-400" />
          </div>
        </motion.div>

        <p className="text-center text-sm text-zinc-400 -mt-1">
          Your guitar's offsets have been saved. Note detection will now be more accurate.
        </p>

        <div className="space-y-2">
          {STRINGS.map((s) => {
            const offset         = offsets[s.id];
            const hasMeasurement = offset !== undefined;
            const abs            = hasMeasurement ? Math.abs(offset) : 0;
            const offsetColor    = !hasMeasurement ? "text-zinc-700" : abs < 10 ? "text-emerald-400" : abs < 30 ? "text-amber-400" : "text-red-400";
            const barColor       = !hasMeasurement ? "" : abs < 10 ? "bg-emerald-500" : abs < 30 ? "bg-amber-500" : "bg-red-500";
            return (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-zinc-600 w-3 tabular-nums">{s.id}</span>
                <span className="font-bold text-sm text-white w-7">{s.name}</span>
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  {hasMeasurement && <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(100, abs * 2)}%` }} />}
                </div>
                <span className={cn("font-mono font-bold text-sm w-12 text-right tabular-nums", offsetColor)}>
                  {hasMeasurement ? `${offset >= 0 ? "+" : ""}${Math.round(offset)}¢` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-1 pb-2">
          <Button onClick={onConfirm} className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-bold h-11">
            <FaCheck className="mr-2 h-3.5 w-3.5" /> Save & Close
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">Discard</Button>
        </div>
      </div>
    </div>
  );
});
