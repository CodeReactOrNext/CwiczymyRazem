import { cn } from "assets/lib/utils";
import { type PointerEvent, useEffect, useMemo, useRef } from "react";

import { getBody, getHead, getNeck } from "../data/guitarParts";
import type { GuitarBuild } from "../types/guitarBuilder.types";
import { layoutGuitar } from "../utils/layout";
import { renderGuitar } from "../utils/renderGuitar";
import {
  clientToBody,
  hitSticker,
  unrotateQuarterTurn,
} from "../utils/stickers";

interface GuitarCanvasProps {
  build: GuitarBuild;
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  /** Drawn stood up (CSS-rotated −90°), as it hangs in a display bay. */
  rotated?: boolean;
  className?: string;
}

export const GuitarCanvas = ({
  build,
  selectedStickerId,
  onSelectSticker,
  onMoveSticker,
  rotated = false,
  className,
}: GuitarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const layout = useMemo(
    () =>
      layoutGuitar(
        getBody(build.bodyKey),
        getNeck(build.neckKey),
        getHead(build.headKey),
      ),
    [build.bodyKey, build.neckKey, build.headKey],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    let stale = false;
    if (canvas) {
      renderGuitar(canvas, build, {
        selectedStickerId,
        isStale: () => stale,
      }).catch((error: unknown) => {
        console.error("[guitarBuilder] render failed", error);
      });
    }
    return () => {
      stale = true;
    };
  }, [build, selectedStickerId]);

  const toBody = (event: PointerEvent<HTMLCanvasElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const local = rotated
      ? unrotateQuarterTurn(event.clientX, event.clientY, rect, {
          width: el.offsetWidth,
          height: el.offsetHeight,
        })
      : { clientX: event.clientX, clientY: event.clientY, box: rect };
    return clientToBody(
      local.clientX,
      local.clientY,
      local.box,
      layout,
      layout.steps[0].dest,
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = toBody(event);
    const hit = hitSticker(build.stickers, point.x, point.y);
    onSelectSticker(hit?.id ?? null);
    if (!hit) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: hit.id, dx: point.x - hit.x, dy: point.y - hit.y };
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = toBody(event);
    const drag = dragRef.current;
    if (drag) {
      onMoveSticker(
        drag.id,
        Math.round(point.x - drag.dx),
        Math.round(point.y - drag.dy),
      );
      return;
    }
    const over = hitSticker(build.stickers, point.x, point.y);
    event.currentTarget.style.cursor = over ? "grab" : "";
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      role='img'
      aria-label='Custom guitar preview'
      className={cn(
        "h-auto w-full",
        build.stickers.length > 0 && "touch-none",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
};
