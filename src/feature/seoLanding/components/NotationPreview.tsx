import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { tablatureToAlphaTex } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/tablatureToAlphaTex";
import { useEffect, useRef, useState } from "react";

interface NotationPreviewProps {
  measures: TablatureMeasure[];
  bpm: number;
  /**
   * Fixed height of the box in px — see notationEmbedHeightPx. The engraved
   * height isn't known until AlphaTab has rendered, so the box is sized up
   * front and scrolls a taller score internally rather than growing and
   * shoving the article down under the reader.
   */
  heightPx: number;
  className?: string;
}

/**
 * Render-only AlphaTab preview (standard notation + tab) for SEO landing
 * pages. No player, no soundfont, no cursor — just the engraved sheet, so the
 * page stays light while still showing real notation. The library is imported
 * lazily on the client; wrap in MountOnVisible so off-screen embeds don't boot.
 */
export const NotationPreview = ({
  measures,
  bpm,
  heightPx,
  className,
}: NotationPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let api: any = null;
    let cancelled = false;

    import("@coderline/alphatab").then((alphaTabLib) => {
      if (cancelled || !containerRef.current) return;
      const AlphaTabApi = (alphaTabLib as any).AlphaTabApi;
      if (!AlphaTabApi) return;

      const origin = window.location.origin;
      api = new AlphaTabApi(containerRef.current, {
        core: {
          scriptFile: `${origin}/alphatab/alphaTab.min.js`,
          fontDirectory: `${origin}/alphatab/font/`,
        },
        display: {
          staveProfile: "ScoreTab",
          // Paper board: AlphaTab's default black ink on the container's white
          // background, same as the practice viewer's light mode. Reads far
          // better than light-on-dark for notation and matches the guide photo.
        },
        player: { enablePlayer: false },
      });

      api.error.on(() => {
        // Failed render: drop the skeleton so the card doesn't pulse forever;
        // the plain-text tab below the preview remains as the fallback.
        if (!cancelled) setReady(true);
      });
      api.renderFinished.on(() => {
        if (!cancelled) setReady(true);
      });
      api.tex(tablatureToAlphaTex(measures, bpm));
    });

    return () => {
      cancelled = true;
      try {
        api?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [measures, bpm]);

  return (
    <div
      className={cn(
        "relative overflow-auto rounded-lg bg-white p-3",
        className,
      )}
      style={{ height: heightPx }}>
      {!ready && (
        <div className='absolute inset-0 animate-pulse rounded-lg bg-zinc-100' />
      )}
      <div
        ref={containerRef}
        className={cn(
          "transition-opacity duration-300",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
};
