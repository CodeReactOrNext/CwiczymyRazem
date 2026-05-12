import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import { memo } from "react";

interface VideoSectionProps {
  youtubeVideoId?: string | null;
  videoUrl?: string | null;
  isPlayalong?: boolean;
  isPlaying: boolean;
  isMobileView: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  setVideoDuration: (d: number) => void;
  setTimerTime: (t: number) => void;
  onVideoEnd: () => void;
}

export const VideoSection = memo(function VideoSection({
  youtubeVideoId,
  videoUrl,
  isPlayalong,
  isPlaying,
  isMobileView,
  startTimer,
  stopTimer,
  setVideoDuration,
  setTimerTime,
  onVideoEnd,
}: VideoSectionProps) {
  if (isPlayalong && youtubeVideoId && !isMobileView) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <YouTubePlayalong
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          onEnd={onVideoEnd}
          onReady={(duration) => setVideoDuration(duration)}
          onSeek={(time) => setTimerTime(time * 1000)}
          onProgressUpdate={(currentTime) => setTimerTime(currentTime * 1000)}
          onStateChange={(state) => {
            if (state === 1) startTimer();
            if (state === 2) stopTimer();
          }}
        />
      </div>
    );
  }

  if (videoUrl) {
    const match = videoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return (
      <div className="aspect-video w-full">
        {videoId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">
            Video not available
          </div>
        )}
      </div>
    );
  }

  return null;
});
