import { memo, useEffect, useRef } from "react";
import { ReportListInterface } from "types/api.types";

interface CalendarSquareProps {
  report: ReportListInterface | undefined;
}

const CalendarSquare = ({ report }: CalendarSquareProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raiting = getPointRaitings(report);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = getRaitingColor(raiting);

        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [raiting]);

  const divClassName = `
    m-[3px]
  `;

  return (
    <canvas ref={canvasRef} width={13} height={13} className={divClassName} />
  );
};
export default memo(CalendarSquare);

const getPointRaitings = (report: ReportListInterface | undefined) => {
  if (!report) return null;
  const { isDateBackReport, points } = report;
  if (isDateBackReport) return "backDate";
  if (points > 30) return "super";
  if (points > 20) return "great";
  if (points > 10) return "nice";
  if (points >= 0) return "ok";
  if (points === 0) return "zero";

  return null;
};

const getRaitingColor = (raiting: string | null) => {
  switch (raiting) {
    case "backDate":
      return "#60A5FA"; // blue-400
    case "super":
      return "#ffecac"; // main-calendar
    case "great":
      return "rgba(255, 236, 172, 0.8)"; // main-calendar/80
    case "nice":
      return "rgba(255, 236, 172, 0.7)"; // main-calendar/70
    case "ok":
      return "rgba(245, 216, 152, 1)"; // main-calendar/60
    case "zero":
      return "rgba(245, 216, 152, 0.2)"; // main-calendar/20
    default:
      return "rgba(71, 85, 105, 0.5)"; // slate-600/50
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
  ctx.fill();
};
