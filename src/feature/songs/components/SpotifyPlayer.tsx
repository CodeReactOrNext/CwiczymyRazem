import { cn } from "assets/lib/utils";

interface SpotifyPlayerProps {
  trackId: string;
  className?: string;
  height?: number;
  /**
   * `dark` pins Spotify's neutral dark embed. Left to `cover`, the embed tints
   * its own background with a colour pulled from the album art — which on
   * bright covers lands as a loud slab that reads as a rendering glitch next
   * to our zinc surfaces.
   */
  theme?: "dark" | "cover";
}

export const SpotifyPlayer = ({
  trackId,
  className,
  height = 152,
  theme = "dark",
}: SpotifyPlayerProps) => {
  if (!trackId) return null;

  const src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator${
    theme === "dark" ? "&theme=0" : ""
  }`;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg bg-zinc-900/50",
        className,
      )}>
      <iframe
        src={src}
        width='100%'
        height={height}
        frameBorder='0'
        allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
        allowFullScreen
        className='block'
      />
    </div>
  );
};
