import { useEffect, useRef, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

interface YouTubePlayalongProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: (duration: number) => void;
  onStateChange?: (state: number) => void;
  onEnd?: () => void;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onSeek?: (timeInSeconds: number) => void;
}

export const YouTubePlayalong = ({
  videoId,
  isPlaying,
  onReady,
  onStateChange,
  onEnd,
  onProgressUpdate,
  onSeek,
}: YouTubePlayalongProps) => {
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsPlayerReady(false);
    stopProgressTracking();
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    
    try {
      if (isPlaying) {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
          startProgressTracking();
        }
      } else {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
          stopProgressTracking();
        }
      }
    } catch (error) {
      console.warn('YouTube player not ready for interaction', error);
    }
  }, [isPlaying, isPlayerReady, videoId]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;
    
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        
        // Detect seeking in native player
        if (Math.abs(current - lastTimeRef.current) > 2) {
          onSeek?.(current);
        }
        
        lastTimeRef.current = current;
        onProgressUpdate?.(current, total);
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopProgressTracking();
  }, []);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 1,
      enablejsapi: 1,
    },
  };

  const handleStateChange = (event: any) => {
    const state = event.data;
    onStateChange?.(state);
    
    if (state === 1) {
      startProgressTracking();
    } else if (state === 2) {
      stopProgressTracking();
    }
    
    if (state === 0) {
      stopProgressTracking();
      onEnd?.();
    }
  };

  const handlePlayerReady = (event: any) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    
    try {
      const videoDuration = event.target.getDuration();
      onReady?.(videoDuration);
    } catch (error) {
      console.error('Error in onReady:', error);
    }
  };

  return (
    <div className="w-full relative group">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 shadow-2xl border-2 border-red-500/30 relative ring-2 ring-red-500/10 transition-all duration-300 hover:border-red-500/50 hover:ring-red-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none z-10" />
        
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
          className="h-full w-full relative z-0"
        />
      </div>
    </div>
  );
};
