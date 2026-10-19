import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, FileAudio, FolderOpen, Plus, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useState } from "react";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";

const sectionTitle = "text-sm font-semibold text-zinc-100";
const bodyText = "text-xs leading-relaxed text-zinc-400";
const smallButton =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const rowIcon =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const rowIconIdle = "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100";

interface RecordingsPanelProps {
  controller: BackingTrackController;
}

/**
 * The files that play under the tab — one backing track, or a few layers of
 * the same take (drums, bass, vocals) — with a level each.
 *
 * Only what belongs to this song is listed. Files added to other songs wait in
 * the library below, one click from coming back.
 */
export function RecordingsPanel({ controller }: RecordingsPanelProps) {
  const { t } = useTranslation("backing_track");
  const {
    desktopAvailable,
    library,
    stems,
    isImporting,
    importTracks,
    addStem,
    removeStem,
    setStem,
    soloStem,
    deleteTrack,
    alignment,
    setAlignment,
    isTrackLoading,
    error,
  } = controller;
  const [showLibrary, setShowLibrary] = useState(false);

  const nameOf = (trackId: string) =>
    library.find((track) => track.id === trackId)?.name ?? t("recordings.missing");
  const onSong = new Set(stems.map((stem) => stem.trackId));
  const elsewhere = library.filter((track) => !onSong.has(track.id));

  if (!desktopAvailable) {
    return (
      <section className='flex flex-col gap-2'>
        <h3 className={sectionTitle}>{t("recordings.title")}</h3>
        <p className={bodyText}>{t("recordings.desktop_only")}</p>
      </section>
    );
  }

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className={sectionTitle}>{t("recordings.title")}</h3>
        <button type='button' onClick={importTracks} disabled={isImporting} className={smallButton}>
          <FolderOpen className='h-3.5 w-3.5' />
          {isImporting ? t("recordings.importing") : t("recordings.add")}
        </button>
      </div>

      {stems.length === 0 ? (
        <p className={bodyText}>{t("recordings.none")}</p>
      ) : (
        <ul className='flex flex-col gap-1.5'>
          {stems.map((stem) => {
            const name = nameOf(stem.trackId);
            return (
              <li
                key={stem.trackId}
                className='flex flex-col gap-2 rounded-lg bg-zinc-900/60 px-3 py-2.5'>
                <div className='flex min-w-0 items-center gap-1'>
                  <FileAudio
                    className={cn(
                      "mr-1 h-3.5 w-3.5 shrink-0",
                      stem.muted ? "text-zinc-600" : "text-zinc-400",
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      stem.muted ? "text-zinc-500" : "text-zinc-200",
                    )}
                    title={name}>
                    {name}
                  </span>
                  {stems.length > 1 && (
                    <button
                      type='button'
                      onClick={() => soloStem(stem.trackId)}
                      title={t("recordings.solo_title")}
                      aria-label={t("recordings.solo", { name })}
                      className={cn(rowIcon, rowIconIdle, "text-xs font-semibold")}>
                      S
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => setStem(stem.trackId, { muted: !stem.muted })}
                    aria-pressed={stem.muted}
                    aria-label={
                      stem.muted
                        ? t("common.unmute", { what: name })
                        : t("common.mute", { what: name })
                    }
                    className={cn(
                      rowIcon,
                      stem.muted ? "bg-amber-500/10 text-amber-400" : rowIconIdle,
                    )}>
                    {stem.muted ? <VolumeX className='h-3.5 w-3.5' /> : <Volume2 className='h-3.5 w-3.5' />}
                  </button>
                  <button
                    type='button'
                    onClick={() => removeStem(stem.trackId)}
                    aria-label={t("recordings.remove", { name })}
                    title={t("recordings.remove_title")}
                    className={cn(rowIcon, rowIconIdle)}>
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>
                <Slider
                  value={[stem.volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  aria-label={t("recordings.volume", { name })}
                  onValueChange={([volume]) => setStem(stem.trackId, { volume })}
                />
              </li>
            );
          })}
        </ul>
      )}

      {stems.length > 1 && (
        // Every layer at once — only worth a row when there is more than one.
        <div className='flex items-center gap-3 px-1'>
          <button
            type='button'
            onClick={() => setAlignment({ muted: !alignment.muted })}
            aria-pressed={alignment.muted}
            aria-label={
              alignment.muted
                ? t("common.unmute", { what: t("recordings.everything") })
                : t("common.mute", { what: t("recordings.everything") })
            }
            className={cn(rowIcon, alignment.muted ? "bg-amber-500/10 text-amber-400" : rowIconIdle)}>
            {alignment.muted ? <VolumeX className='h-3.5 w-3.5' /> : <Volume2 className='h-3.5 w-3.5' />}
          </button>
          <span className='w-20 shrink-0 text-xs text-zinc-400'>{t("recordings.master")}</span>
          <Slider
            value={[alignment.volume]}
            min={0}
            max={1}
            step={0.01}
            aria-label={t("recordings.master")}
            onValueChange={([volume]) => setAlignment({ volume })}
            className='flex-1'
          />
        </div>
      )}

      {isTrackLoading && <p className={bodyText}>{t("recordings.loading")}</p>}
      {error && <p className='text-xs text-red-400'>{error}</p>}

      {elsewhere.length > 0 && (
        <div className='flex flex-col gap-1.5'>
          <button
            type='button'
            onClick={() => setShowLibrary((open) => !open)}
            aria-expanded={showLibrary}
            className='flex items-center gap-1.5 self-start rounded-md px-1 py-0.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", !showLibrary && "-rotate-90")}
            />
            {t("recordings.library", { count: elsewhere.length })}
          </button>
          {showLibrary && (
            <ul className='flex max-h-48 flex-col gap-1 overflow-y-auto'>
              {elsewhere.map((track) => (
                <li key={track.id} className='flex items-center gap-1 rounded-lg px-1 py-0.5'>
                  <button
                    type='button'
                    onClick={() => addStem(track.id)}
                    aria-label={t("recordings.add_to_song", { name: track.name })}
                    className='flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                    <Plus className='h-3.5 w-3.5 shrink-0 text-zinc-500' />
                    <span className='truncate'>{track.name}</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => deleteTrack(track.id)}
                    aria-label={t("recordings.delete", { name: track.name })}
                    className={cn(rowIcon, rowIconIdle)}>
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
