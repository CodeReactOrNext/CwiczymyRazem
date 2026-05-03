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

      <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="flex justify-center"
        >
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <img src="/images/calibration/summary.png" alt="Calibration Complete" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        <div className="space-y-4 text-center">
          <h3 className="text-xl font-bold text-white tracking-tight">Everything's ready!</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your calibration is complete. If you feel the detection is still slightly off,
            consider re-tuning your guitar or adjusting the input sensitivity.
          </p>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            Good luck!
          </p>
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
