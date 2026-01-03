import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ReportListInterface } from "types/api.types";

import type { DateWithReport } from "../activityLog.types";

interface ActivityCalendarCanvasProps {
  datasWithReports: DateWithReport[];
  onHover: (item: DateWithReport | null, x: number, y: number) => void;
  onClick: (item: DateWithReport) => void;
}

const SQUARE_SIZE = 14;
const GAP = 5;
const CELL_SIZE = SQUARE_SIZE + GAP;
const BORDER_RADIUS = 3;

const getPointRatings = (report: ReportListInterface | undefined) => {
  if (!report) return null;
  const { points } = report;
  if (points > 30) return "super";
  if (points > 20) return "great";
  if (points > 10) return "nice";
  if (points >= 0) return "ok";
  if (points === 0) return "zero";
  return null;
};

const getRatingColor = (rating: string | null) => {
  switch (rating) {
    case "super":
      return "#0891B2";
    case "great":
      return "#06B6D4";
    case "nice":
      return "#22D3EE";
    case "ok":
      return "#67E8F9";
    case "zero":
      return "#A5F3FC";
    default:
      return "#3f3f46";
  }
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const ActivityCalendarCanvas = ({
  datasWithReports,
  onHover,
  onClick,
}: ActivityCalendarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const cols = Math.ceil(datasWithReports.length / 7);
  const canvasWidth = cols * CELL_SIZE;
  const canvasHeight = 7 * CELL_SIZE;

  // Draw static content only when data changes
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Minimize resizing thrashing by checking if size changed
    if (canvas.width !== canvasWidth * dpr || canvas.height !== canvasHeight * dpr) {
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.scale(dpr, dpr);
    } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    datasWithReports.forEach((item, index) => {
      const col = Math.floor(index / 7);
      const row = index % 7;
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;

      const rating = item ? getPointRatings(item.report) : null;
      ctx.fillStyle = getRatingColor(rating);
      drawRoundedRect(ctx, x, y, SQUARE_SIZE, SQUARE_SIZE, BORDER_RADIUS);
      ctx.fill();

      if (item?.report?.exceriseTitle || item?.report?.isDateBackReport) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (item.report.isDateBackReport) {
          ctx.arc(x + SQUARE_SIZE / 2, y + SQUARE_SIZE / 2, 3, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          ctx.arc(x + SQUARE_SIZE / 2, y + SQUARE_SIZE / 2, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
  }, [datasWithReports, canvasWidth, canvasHeight]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = e.currentTarget.scrollLeft;
      
      const mouseX = e.clientX - rect.left + scrollLeft;
      const mouseY = e.clientY - rect.top;

      const col = Math.floor(mouseX / CELL_SIZE);
      const row = Math.floor(mouseY / CELL_SIZE);

      const localX = mouseX - col * CELL_SIZE;
      const localY = mouseY - row * CELL_SIZE;

      if (col >= 0 && row >= 0 && row < 7 && localX <= SQUARE_SIZE && localY <= SQUARE_SIZE) {
        const index = col * 7 + row;
        if (index >= 0 && index < datasWithReports.length) {
          const item = datasWithReports[index];
          if (item) {
             // Move highlight without React render
             if (highlightRef.current) {
               highlightRef.current.style.opacity = "1";
               highlightRef.current.style.transform = `translate(${col * CELL_SIZE}px, ${row * CELL_SIZE}px)`;
             }
            onHover(item, e.clientX, e.clientY);
            return;
          }
        }
      }

      if (highlightRef.current) highlightRef.current.style.opacity = "0";
      onHover(null, 0, 0);
    },
    [datasWithReports, onHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (highlightRef.current) highlightRef.current.style.opacity = "0";
    onHover(null, 0, 0);
  }, [onHover]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = e.currentTarget.scrollLeft;
      
      const mouseX = e.clientX - rect.left + scrollLeft;
      const mouseY = e.clientY - rect.top;

      const col = Math.floor(mouseX / CELL_SIZE);
      const row = Math.floor(mouseY / CELL_SIZE);

      const localX = mouseX - col * CELL_SIZE;
      const localY = mouseY - row * CELL_SIZE;

      if (col >= 0 && row >= 0 && row < 7 && localX <= SQUARE_SIZE && localY <= SQUARE_SIZE) {
        const index = col * 7 + row;
        if (index >= 0 && index < datasWithReports.length) {
          const item = datasWithReports[index];
          if (item?.report) {
            onClick(item);
          }
        }
      }
    },
    [datasWithReports, onClick]
  );

  return (
    <div 
      className="relative cursor-pointer"
      style={{ width: canvasWidth, height: canvasHeight }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{ width: canvasWidth, height: canvasHeight, display: 'block' }}
      />
      {/* Hardware accelerated highlight overlay */}
      <div 
        ref={highlightRef}
        className="pointer-events-none absolute left-0 top-0 rounded-[3px] border-2 border-white/90 shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-opacity duration-150"
        style={{
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          opacity: 0,
          willChange: "transform, opacity"
        }}
      />
    </div>
  );
};
export default memo(ActivityCalendarCanvas);
