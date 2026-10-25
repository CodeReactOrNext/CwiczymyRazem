import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { Music, Play, RefreshCw, SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { FaYoutube } from "react-icons/fa";

import { useSessionUI } from "../contexts/SessionUIContext";

// Slight phrasing variety so each search surfaces different tracks instead of
// the same cached 3. Each variant is its own cache key on the API side.
const SEARCH_PHRASES = [
  "Guitar Backing Track",
  "Blues Guitar Backing Track",
  "Rock Guitar Backing Track",
  "Jam Backing Track Guitar",
  "Slow Blues Backing Track Guitar",
  "Funk Guitar Backing Track",
  "Smooth Jazz Backing Track Guitar",
  "Pop Rock Guitar Backing Track",
  "Acoustic Guitar Backing Track",
  "Groove Backing Track Guitar",
];

type PickerState = "idle" | "loading" | "results";

// The YouTube API returns titles HTML-escaped ("80&#39;s Rock"), and the
// search cache stores them that way — decode them for display.
function decodeEntities(text: string) {
  return new DOMParser().parseFromString(text, "text/html").documentElement.textContent ?? text;
}

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface BackingTrackPickerProps {
  exerciseTitle: string;
  searchQueries?: string[];
  /** Phone layout — one row with the button, results as rows with a small
   *  thumbnail, so all of them fit on a sideways screen. */
  compact?: boolean;
}

export function BackingTrackPicker({ exerciseTitle, searchQueries, compact = false }: BackingTrackPickerProps) {
  const { t } = useTranslation("session");
  const { setBackingVideoId } = useSessionUI();
  const [state, setState] = useState<PickerState>("idle");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const lastPhraseRef = useRef<string | null>(null);

  function nextPhrase() {
    const phrases = searchQueries && searchQueries.length > 0 ? searchQueries : SEARCH_PHRASES;
    if (phrases.length === 1) return phrases[0];

    // Pick a random phrase, but never the same one twice in a row so
    // "Search again" always changes what comes up.
    let phrase = lastPhraseRef.current;
    while (phrase === lastPhraseRef.current) {
      phrase = phrases[Math.floor(Math.random() * phrases.length)];
    }
    lastPhraseRef.current = phrase;
    return phrase!;
  }

  async function search() {
    setState("loading");
    try {
      const q = encodeURIComponent(nextPhrase());
      const res = await fetch(`/api/songs/search-youtube?q=${q}`);
      const data = await res.json();
      setVideos((data.videos ?? []).map((video: VideoResult) => ({
        ...video,
        title: decodeEntities(video.title),
        channel: decodeEntities(video.channel),
      })));
      setState("results");
    } catch {
      setState("idle");
    }
  }

  const resultTitle = (video: VideoResult) => (
    <div className="min-w-0">
      <p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-200">{video.title}</p>
      <p className="mt-1 truncate text-[11px] text-zinc-400">{video.channel}</p>
    </div>
  );

  const searchAgain = (
    <Button variant='ghost' size='sm' onClick={search} className='text-zinc-400 hover:text-zinc-100'>
      <RefreshCw className="mr-1.5" />
      {t("backing.search_again")}
    </Button>
  );

  const searching = (
    <span className="flex items-center gap-2 text-xs text-zinc-400 animate-pulse">
      <SearchIcon className="h-3.5 w-3.5" />
      {t("backing.searching")}
    </span>
  );

  // Phone: one row — what's needed and the button — with the results listed under it.
  if (compact) {
    return (
      <div className="flex w-full flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Music className="h-5 w-5 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-sm font-medium text-zinc-200">{t("backing.required")}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{t("backing.find_hint")}</p>
          </div>
          {state === "idle" && (
            <Button variant='secondary' size='sm' onClick={search}>
              <FaYoutube className="mr-1.5 text-red-500" />
              {t("backing.find_short")}
            </Button>
          )}
          {state === "loading" && searching}
          {state === "results" && searchAgain}
        </div>

        {state === "results" && (
          <div className="-mx-2 flex flex-col gap-1">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setBackingVideoId(video.id)}
                className="flex items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-zinc-800/60 focus-visible:ring-1 focus-visible:ring-ring"
              >
                <img src={video.thumbnail} alt="" className="aspect-video w-24 shrink-0 rounded object-cover" />
                {resultTitle(video)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-1.5">
        <Music className="mb-2 h-6 w-6 text-zinc-400" />
        <p className="text-base font-semibold text-zinc-200">{t("backing.required")}</p>
        <p className="text-sm text-zinc-400">{t("backing.find_hint")}</p>
      </div>

      {state === "idle" && (
        <Button variant='secondary' onClick={search}>
          <FaYoutube className="mr-1.5 text-red-500" />
          {t("backing.find")}
        </Button>
      )}

      {state === "loading" && searching}

      {state === "results" && (
        <>
          <div className="grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setBackingVideoId(video.id)}
                className="group flex flex-col gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-zinc-800/50 focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="relative overflow-hidden rounded">
                  <img src={video.thumbnail} alt="" className="aspect-video w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white p-2.5 text-black">
                      <Play className="h-3.5 w-3.5 translate-x-px" />
                    </div>
                  </div>
                </div>
                {resultTitle(video)}
              </button>
            ))}
          </div>
          {searchAgain}
        </>
      )}
    </div>
  );
}

interface BackingVideoPlayerProps {
  videoId: string;
  onChangeClick: () => void;
}

export function BackingVideoPlayer({ videoId, onChangeClick }: BackingVideoPlayerProps) {
  const { t } = useTranslation("session");
  return (
    <div className="flex w-full flex-col items-center gap-3 p-4">
      <div className="aspect-video w-full max-w-sm overflow-hidden rounded-lg bg-zinc-950">
        {/* loop=1 + playlist=<id> makes a single video repeat, so a backing track
            shorter than the exercise keeps playing for the whole session. */}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      </div>
      <Button variant='ghost' size='sm' onClick={onChangeClick} className='text-zinc-400 hover:text-zinc-100'>
        <FaYoutube className="mr-1.5" />
        {t("backing.change")}
      </Button>
    </div>
  );
}
