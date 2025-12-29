import { cn } from "assets/lib/utils";

interface SpotifyPlayerProps {
  trackId: string;
  className?: string;
  height?: number;
}

export const SpotifyPlayer = ({ trackId, className, height = 152 }: SpotifyPlayerProps) => {
  if (!trackId) return null;

  return (
    <div className={cn("w-full overflow-hidden rounded-xl bg-zinc-900/50 border border-white/5", className)}>
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        frameBorder="0"
        allowFullScreen={false}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block"
      />
    </div>
  );
};
