import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { tablatureToAlphaTex } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/tablatureToAlphaTex";
import { useEffect, useRef, useState } from "react";

interface NotationPreviewProps {
  measures: TablatureMeasure[];
  bpm: number;
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
          // Dark-board ink, same values as AlphaTabScoreViewer's dark mode —
          // the board itself is the container's near-black background.
          resources: {
            staffLineColor: "#52525b",
            barSeparatorColor: "#52525b",
            barNumberColor: "#a1a1aa",
            mainGlyphColor: "#f4f4f5",
            secondaryGlyphColor: "#a1a1aa",
            scoreInfoColor: "#e4e4e7",
          },
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
        "relative min-h-[180px] overflow-x-auto rounded-lg bg-zinc-950/70 p-3",
        className
      )}>
      {!ready && (
        <div className='absolute inset-0 animate-pulse rounded-lg bg-zinc-900/60' />
      )}
      <div
        ref={containerRef}
        className={cn(
          "transition-opacity duration-300",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
