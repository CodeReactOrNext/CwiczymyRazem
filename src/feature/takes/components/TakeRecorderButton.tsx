import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PRESSABLE_KEY } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import {
  placePopover,
  POPOVER_WIDTH,
  type PopoverPlacement,
} from "feature/toneStudio/components/AmpSimButton";
import { useTranslation } from "hooks/useTranslation";
import { Circle, FolderOpen, Loader2, Music, Square, Trash2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TakeEntry, TakeMode } from "types/takes";

import { isTakeRecordingAvailable, startTake, stopTake } from "../services/takeController";
import { MAX_TAKE_TRIM_MS, useTakeStore } from "../store/takeStore";

interface TakeRecorderButtonProps {
  /** What is being played — goes into the file name. */
  title?: string;
  /** Icon-only trigger to match the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons. */
  h?: string;
}

const TAKES_QUERY_KEY = ["takes", "list"] as const;
const FOLDER_QUERY_KEY = ["takes", "folder"] as const;
/** Takes the menu lists; the folder has the rest. */
const LISTED_TAKES = 4;

const MODES: { mode: TakeMode; icon: typeof Music }[] = [
  { mode: "audio", icon: Music },
  { mode: "video", icon: Video },
];

const smallKey =
  "flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 text-xs text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-50";

function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Seconds since `startedAt`, ticking while it is set. */
function useElapsedSeconds(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);
  return startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000);
}

function TakeRow({ take, onRemoved }: { take: TakeEntry; onRemoved: () => void }) {
  const { t } = useTranslation("session");
  const main = take.files.find((file) => file.role !== "backing") ?? take.files[0];
  const Icon = take.kind === "video" ? Video : Music;
  const when = new Date(take.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const detail = [when, take.durationSec !== null ? formatClock(take.durationSec) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className='flex items-center gap-1.5'>
      <button
        type='button'
        onClick={() => main && window.takes?.open(main.name)}
        title={t("takes.play")}
        className='flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg bg-zinc-800/60 px-3 text-left transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
        <Icon className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-xs font-medium text-zinc-200'>
            {take.title || t("takes.untitled")}
          </span>
          <span className='block truncate text-[11px] text-zinc-400'>{detail}</span>
        </span>
      </button>
      <button
        type='button'
        onClick={() => main && window.takes?.reveal(main.name)}
        title={t("takes.show_in_folder")}
        aria-label={t("takes.show_in_folder")}
        className='flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
        <FolderOpen className='h-3.5 w-3.5' />
      </button>
      <button
        type='button'
        onClick={async () => {
          await window.takes?.remove(take.id);
          onRemoved();
        }}
        title={t("takes.delete")}
        aria-label={t("takes.delete")}
        className='flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
        <Trash2 className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}

/**
 * Desktop-only: records the player's playing to a file on their computer —
 * the guitar with the backing as audio, or the tablature with the score as a
 * video. Renders nothing on the web build (window.takes is absent).
 *
 * A click while a take runs ends it; otherwise it opens the menu the take is
 * set up and started from, which also lists what was recorded.
 */
export const TakeRecorderButton = ({ title = "", compact = false, h = "h-12" }: TakeRecorderButtonProps) => {
  const { t } = useTranslation("session");
  const queryClient = useQueryClient();
  const status = useTakeStore((state) => state.status);
  const startedAt = useTakeStore((state) => state.startedAt);
  const failure = useTakeStore((state) => state.failure);
  const guitar = useTakeStore((state) => state.guitar);
  const lastSaved = useTakeStore((state) => state.lastSaved);
  const mode = useTakeStore((state) => state.mode);
  const setMode = useTakeStore((state) => state.setMode);
  const split = useTakeStore((state) => state.split);
  const setSplit = useTakeStore((state) => state.setSplit);
  const trimMs = useTakeStore((state) => state.trimMs);
  const setTrimMs = useTakeStore((state) => state.setTrimMs);

  // The bridge only exists in the desktop window, never during server render.
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setAvailable(isTakeRecordingAvailable()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const elapsed = useElapsedSeconds(status === "recording" ? startedAt : null);

  const takes = useQuery({
    queryKey: TAKES_QUERY_KEY,
    queryFn: () => window.takes?.list() ?? [],
    enabled: available && open,
  });
  const folder = useQuery({
    queryKey: FOLDER_QUERY_KEY,
    queryFn: () => window.takes?.getFolder() ?? "",
    enabled: available && open,
  });

  // A take belongs to the session it was started in: leaving ends and keeps it.
  useEffect(() => () => void stopTake(), []);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleReflow = () => {
      if (rootRef.current) setPlacement(placePopover(rootRef.current));
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReflow);
    window.addEventListener("scroll", handleReflow, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow, true);
    };
  }, [open]);

  if (!available) return null;

  const busy = status === "starting" || status === "saving";
  const recording = status === "recording";
  const refreshTakes = () => queryClient.invalidateQueries({ queryKey: TAKES_QUERY_KEY });

  const openMenu = () => {
    if (rootRef.current) setPlacement(placePopover(rootRef.current));
    setOpen(true);
  };

  const handleTrigger = async () => {
    if (busy) return;
    if (recording) {
      await stopTake();
      await refreshTakes();
      // What was just recorded is the first thing in the menu.
      openMenu();
      return;
    }
    if (open) setOpen(false);
    else openMenu();
  };

  const handleStart = () => {
    // The menu would be in the picture, and covers the board on small windows.
    setOpen(false);
    void startTake(title);
  };

  const handleChooseFolder = async () => {
    const chosen = await window.takes?.chooseFolder();
    if (!chosen) return;
    await queryClient.invalidateQueries({ queryKey: FOLDER_QUERY_KEY });
    await refreshTakes();
  };

  const triggerLabel = recording
    ? t("takes.stop")
    : status === "starting"
      ? t("takes.starting")
      : status === "saving"
        ? t("takes.saving")
        : t("takes.title");

  const listed = (takes.data ?? []).slice(0, LISTED_TAKES);

  return (
    <div className='relative' ref={rootRef}>
      <button
        type='button'
        onClick={handleTrigger}
        disabled={busy}
        title={triggerLabel}
        aria-label={triggerLabel}
        className={cn(
          PRESSABLE_KEY,
          "flex items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/60 disabled:opacity-70",
          compact ? "h-8 justify-center px-2" : cn("gap-2 px-4", h),
          recording
            ? "bg-red-950 text-red-400 hover:bg-red-900"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
        )}>
        {busy ? (
          <Loader2 className={cn("animate-spin", compact ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0")} />
        ) : recording ? (
          <Square className={cn("fill-current", compact ? "h-3 w-3" : "h-3.5 w-3.5 shrink-0")} />
        ) : (
          <Circle className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0")} />
        )}
        {recording ? (
          <span className={cn("font-semibold tabular-nums", compact ? "ml-1.5 text-[10px]" : "text-[11px]")}>
            {formatClock(elapsed)}
          </span>
        ) : (
          !compact && (
            <span className='text-[10px] font-semibold tracking-wide'>{t("takes.short")}</span>
          )
        )}
      </button>

      {open &&
        placement &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: placement.top,
              bottom: placement.bottom,
              right: placement.right,
              width: POPOVER_WIDTH,
              maxHeight: placement.maxHeight,
            }}
            className='fixed z-[99999999] overflow-y-auto rounded-lg bg-zinc-900/95 text-left text-white backdrop-blur-md [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'>
            <div className='flex flex-col gap-7 p-5'>
              {/* ── What to record ── */}
              <section className='flex flex-col gap-4'>
                <div className='text-sm font-semibold leading-tight'>{t("takes.title")}</div>

                <div role='tablist' aria-label={t("takes.mode_label")} className='grid grid-cols-2 gap-1 rounded-lg bg-zinc-950/60 p-1'>
                  {MODES.map(({ mode: choice, icon: Icon }) => {
                    const selected = mode === choice;
                    return (
                      <button
                        key={choice}
                        type='button'
                        role='tab'
                        aria-selected={selected}
                        onClick={() => setMode(choice)}
                        className={cn(
                          "flex h-8 items-center justify-center gap-1.5 rounded px-2 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                          selected
                            ? "bg-zinc-700/70 font-medium text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
                        )}>
                        <Icon className='h-3.5 w-3.5' />
                        {t(`takes.mode.${choice}`)}
                      </button>
                    );
                  })}
                </div>

                <p className='text-[11px] leading-relaxed text-zinc-400'>{t(`takes.about.${mode}`)}</p>

                <div className='flex flex-col gap-2'>
                  <label className='flex items-center justify-between gap-3 text-xs text-zinc-200'>
                    <span>{t("takes.split")}</span>
                    <Switch checked={split} onChange={() => setSplit(!split)} aria-label={t("takes.split")} />
                  </label>
                  {split && (
                    <p className='text-[11px] leading-relaxed text-zinc-400'>{t(`takes.split_hint.${mode}`)}</p>
                  )}
                </div>

                <button
                  type='button'
                  onClick={handleStart}
                  className={cn(
                    PRESSABLE_KEY,
                    "flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                  )}>
                  <Circle className='h-3.5 w-3.5 fill-red-500 text-red-500' />
                  {t("takes.start")}
                </button>

                {failure && (
                  <p className='rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400'>
                    {t(`takes.failure.${failure}`)}
                  </p>
                )}
                {lastSaved && guitar === "none" && (
                  <p className='rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400'>
                    {t("takes.no_guitar")}
                  </p>
                )}
              </section>

              {/* ── Sync: the one thing that cannot be measured from in here ── */}
              <section className='flex flex-col gap-2'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-zinc-200'>{t("takes.trim")}</span>
                  <span className='tabular-nums text-zinc-400'>
                    {trimMs > 0 ? "+" : ""}
                    {trimMs} ms
                  </span>
                </div>
                <Slider
                  min={-MAX_TAKE_TRIM_MS}
                  max={MAX_TAKE_TRIM_MS}
                  step={5}
                  value={[trimMs]}
                  onValueChange={([value]) => setTrimMs(value)}
                  aria-label={t("takes.trim")}
                  className={cn(
                    "cursor-pointer",
                    // A correction either side of zero: no filled range to read as "how much".
                    "[&>span:first-child>span]:bg-transparent [&>span:first-child]:bg-white/15",
                    "[&_[role=slider]]:border-white/60 [&_[role=slider]]:bg-white",
                  )}
                />
                <p className='text-[11px] leading-relaxed text-zinc-400'>{t("takes.trim_hint")}</p>
              </section>

              {/* ── What has been recorded ── */}
              <section className='flex flex-col gap-3'>
                <div className='text-xs text-zinc-400'>{t("takes.recent")}</div>
                {listed.length === 0 ? (
                  <p className='text-[11px] text-zinc-400'>{t("takes.empty")}</p>
                ) : (
                  <div className='flex flex-col gap-1.5'>
                    {listed.map((take) => (
                      <TakeRow key={take.id} take={take} onRemoved={refreshTakes} />
                    ))}
                  </div>
                )}
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => window.takes?.openFolder()}
                    title={folder.data || undefined}
                    className={cn(PRESSABLE_KEY, smallKey, "flex-1")}>
                    <FolderOpen className='h-3.5 w-3.5 text-zinc-400' />
                    {t("takes.open_folder")}
                  </button>
                  <button type='button' onClick={handleChooseFolder} className={cn(PRESSABLE_KEY, smallKey)}>
                    {t("takes.change_folder")}
                  </button>
                </div>
              </section>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
