import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { FaMicrophoneSlash } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";

interface NoteHuntDetectorProps {
  targetNote: string;
  description?: string;
  isMicEnabled: boolean;
  isListening: boolean;
}

const SUPERSCRIPT = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const toSuperscript = (n: number) =>
  String(n).split("").map(d => SUPERSCRIPT[Number(d)] ?? d).join("");

export function NoteHuntDetector({
  targetNote,
  description,
  isMicEnabled,
  isListening,
}: NoteHuntDetectorProps) {
  const { noteHunt } = useNoteMatchingContext();

  const detectedNote   = noteHunt?.detectedNote ?? null;
  const detectedOctave = noteHunt?.detectedOctave ?? null;
  const cents          = noteHunt?.cents ?? 0;
  const isMatch        = noteHunt?.isMatch ?? false;
  const foundOctaves   = noteHunt?.foundOctaves ?? [];
  const hitId          = noteHunt?.hitId ?? 0;
  const octaves        = noteHunt?.octaves ?? [];

  const foundInRange = octaves.filter(o => foundOctaves.includes(o)).length;
  const allFound = octaves.length > 0 && foundInRange === octaves.length;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      {/* Target note card */}
      <div className="relative group">
        <div
          className={cn(
            "absolute -inset-6 blur-[30px] rounded-lg transition-opacity",
            isMatch
              ? "bg-emerald-500/40 opacity-90"
              : "bg-cyan-500/20 opacity-50 group-hover:opacity-80 animate-pulse",
          )}
        />
        <motion.div
          animate={isMatch ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "relative w-24 h-24 rounded-lg flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden transition-colors",
            isMatch ? "bg-emerald-900/80 ring-2 ring-emerald-400/70" : "bg-zinc-900/80",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <span className="text-5xl font-extrabold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {targetNote}
          </span>
        </motion.div>
      </div>

      {description && (
        <p className="text-[10px] text-zinc-500 font-bold tracking-widest text-center">
          {description}
        </p>
      )}

      {/* Pitch-detection feedback */}
      {!isMicEnabled ? (
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <FaMicrophoneSlash className="h-3 w-3" />
          <span>Enable <span className="text-emerald-400 font-semibold">Pitch Detect</span> to track your hits</span>
        </div>
      ) : !isListening ? (
        <p className="text-[11px] text-zinc-500">Starting microphone…</p>
      ) : (
        <div className="flex w-full flex-col items-center gap-2.5">
          {/* Live readout */}
          <div className="relative h-6 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {isMatch ? (
                <motion.span
                  key={`hit-${hitId}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-black tracking-widest text-emerald-400 capitalize"
                >
                  ✓ {targetNote} found!
                </motion.span>
              ) : detectedNote ? (
                <span className="text-[11px] font-mono text-zinc-400">
                  Heard{" "}
                  <span className="font-bold text-zinc-200">
                    {detectedNote}{detectedOctave !== null ? toSuperscript(detectedOctave) : ""}
                  </span>{" "}
                  <span className="text-zinc-600">
                    {cents > 0 ? `+${Math.round(cents)}` : Math.round(cents)}¢
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-zinc-600">Play the note anywhere on the neck…</span>
              )}
            </AnimatePresence>
          </div>

          {/* Octave chips */}
          {octaves.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {octaves.map(o => {
                const found = foundOctaves.includes(o);
                const isCurrent = isMatch && detectedOctave === o;
                return (
                  <span
                    key={o}
                    className={cn(
                      "flex h-7 min-w-[2rem] items-center justify-center rounded-md border px-1.5 text-xs font-bold transition-all",
                      isCurrent
                        ? "border-emerald-400 bg-emerald-500/30 text-emerald-200 scale-110"
                        : found
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-zinc-800/60 text-zinc-500",
                    )}
                  >
                    {targetNote}{toSuperscript(o)}
                  </span>
                );
              })}
            </div>
          )}

          {/* Progress */}
          {octaves.length > 0 && (
            <p
              className={cn(
                "text-[10px] font-bold tracking-widest transition-colors",
                allFound ? "text-emerald-400" : "text-zinc-500",
              )}
            >
              {allFound ? "★ ALL OCTAVES FOUND" : `${foundInRange} / ${octaves.length} OCTAVES FOUND`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
