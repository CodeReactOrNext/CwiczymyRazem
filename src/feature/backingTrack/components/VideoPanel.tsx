import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { useTranslation } from "hooks/useTranslation";
import { MonitorPlay, TriangleAlert } from "lucide-react";
import { useState } from "react";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import { shiftedBy } from "../utils/tempoMap";
import { OffsetStepper } from "./OffsetStepper";

const sectionTitle = "text-sm font-semibold text-zinc-100";
const bodyText = "text-xs leading-relaxed text-zinc-400";
const smallButton =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface VideoPanelProps {
  controller: BackingTrackController;
  /**
   * The box the video is shown in. The player itself lives in the bar above
   * the tab and is laid over this box — moving it in the tree would destroy
   * the iframe and make the video buffer again.
   */
  videoSlotRef?: (element: HTMLDivElement | null) => void;
}

/**
 * The song's video: a picture to play along to, never a sound.
 *
 * It runs on its own sync because it is usually a different take from the
 * files — a live cut, the official video. When it *is* the same take, one
 * click copies the recording's sync onto it.
 */
export function VideoPanel({ controller, videoSlotRef }: VideoPanelProps) {
  const { t } = useTranslation("backing_track");
  const {
    youtubeVideoId,
    setYouTubeVideoId,
    videoOverlay,
    setVideoOverlay,
    videoAlignment,
    setVideoAlignment,
    youtubeCanFollowTempo,
    alignment,
    stems,
    effectiveBpm,
  } = controller;
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState(false);

  const handleSaveUrl = () => {
    const videoId = extractVideoId(urlInput.trim());
    if (!videoId) {
      setUrlError(true);
      return;
    }
    setYouTubeVideoId(videoId);
    setUrlInput("");
    setUrlError(false);
  };

  const isSameAsRecording =
    Math.round(videoAlignment.offsetMs) === Math.round(alignment.offsetMs) &&
    videoAlignment.sourceBpm === alignment.sourceBpm &&
    JSON.stringify(videoAlignment.tempoAnchors ?? []) === JSON.stringify(alignment.tempoAnchors ?? []);

  return (
    // A card of its own: it used to sit as a line of grey text at the foot of
    // the column, and nobody noticed a video could be added at all.
    <section className='flex flex-col gap-3 rounded-xl bg-zinc-900/60 p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className={cn(sectionTitle, "flex items-center gap-2")}>
          <MonitorPlay className='h-4 w-4 text-zinc-300' />
          {t("video.title")}
        </h3>
        {youtubeVideoId && (
          <label className='flex items-center gap-2 text-xs text-zinc-400'>
            {t("video.show")}
            <Switch
              checked={videoOverlay}
              onChange={() => setVideoOverlay(!videoOverlay)}
              aria-label={t("video.show")}
            />
          </label>
        )}
      </div>

      {!youtubeVideoId ? (
        <>
          <p className={bodyText}>{t("video.body")}</p>
          <div className='flex flex-col gap-2'>
            <input
              className={cn(
                "h-9 w-full rounded-lg bg-zinc-950/60 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:bg-zinc-950",
                urlError && "bg-red-500/10",
              )}
              placeholder='youtube.com/watch?v=…'
              aria-label={t("video.link")}
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setUrlError(false);
              }}
              onKeyDown={(event) => event.key === "Enter" && handleSaveUrl()}
            />
            <button
              type='button'
              onClick={handleSaveUrl}
              className={cn(smallButton, "justify-center py-2 text-sm")}>
              {t("video.add")}
            </button>
          </div>
          {urlError && <p className='text-xs text-red-400'>{t("video.bad_link")}</p>}
        </>
      ) : (
        <>
          {videoOverlay && (
            <div ref={videoSlotRef} className='aspect-video w-full rounded-lg bg-black' />
          )}

          {videoOverlay && !youtubeCanFollowTempo && (
            <p className='flex items-start gap-2 text-xs leading-relaxed text-amber-400'>
              <TriangleAlert className='mt-0.5 h-3.5 w-3.5 shrink-0' />
              {t("video.no_speed", { bpm: Math.round(effectiveBpm) })}
            </p>
          )}

          <div className='flex flex-col gap-1.5'>
            <span className='text-xs text-zinc-400'>{t("video.offset")}</span>
            <OffsetStepper
              valueMs={videoAlignment.offsetMs}
              onChange={(offsetMs) =>
                setVideoAlignment(shiftedBy(videoAlignment, offsetMs - videoAlignment.offsetMs))
              }
              label={t("video.offset")}
            />
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {stems.length > 0 && (
              <button
                type='button'
                onClick={() =>
                  setVideoAlignment(
                    {
                      offsetMs: alignment.offsetMs,
                      sourceBpm: alignment.sourceBpm,
                      tempoAnchors: alignment.tempoAnchors ?? [],
                    },
                    { realign: true },
                  )
                }
                disabled={isSameAsRecording}
                title={t("video.same_take_title")}
                className={cn(smallButton, "disabled:cursor-default disabled:opacity-50")}>
                {isSameAsRecording ? t("video.same_take_done") : t("video.same_take")}
              </button>
            )}
            <button type='button' onClick={() => setYouTubeVideoId(null)} className={smallButton}>
              {t("video.remove")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
