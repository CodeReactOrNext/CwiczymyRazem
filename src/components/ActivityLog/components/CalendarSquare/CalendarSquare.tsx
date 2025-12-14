import { memo, useEffect, useRef, useState } from "react";
import type { ReportListInterface } from "types/api.types";

interface CalendarSquareProps {
  report: ReportListInterface | undefined;
}

const CalendarSquare = ({ report }: CalendarSquareProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const raiting = getPointRaitings(report);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw rounded background
        context.fillStyle = getRaitingColor(raiting);
        drawRoundedRect(context, 0, 0, canvas.width, canvas.height, 2);
        context.fill();

        // Add dot indicator for title or back date
        if (report?.exceriseTitle || report?.isDateBackReport) {
          context.fillStyle = "#ffffff";
          context.beginPath();
          if (report.isDateBackReport) {
            // Draw a ring for back date reports
            context.arc(canvas.width / 2, canvas.height / 2, 3, 0, 2 * Math.PI);
            context.stroke();
          } else {
            // Draw a filled dot for regular reports with title
            context.arc(canvas.width / 2, canvas.height / 2, 2, 0, 2 * Math.PI);
            context.fill();
          }
        }

        // Add hover effect
        if (isHovered && report) {
          context.strokeStyle = "#ffffff";
          context.lineWidth = 1;
          drawRoundedRect(
            context,
            1,
            1,
            canvas.width - 2,
            canvas.height - 2,
            2
          );
          context.stroke();
        }
      }
    }
  }, [raiting, isHovered, report?.exceriseTitle, report?.isDateBackReport]);

  const divClassName = `
    m-[3px] 
    transition-transform duration-200 ease-in-out
    ${isHovered ? "scale-150" : ""}
    cursor-pointer
  `;

  return (
    <canvas
      ref={canvasRef}
      width={13}
      height={13}
      className={divClassName}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};

export default memo(CalendarSquare);

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

const getPointRaitings = (report: ReportListInterface | undefined) => {
  if (!report) return null;
  const { points } = report;
  if (points > 30) return "super";
  if (points > 20) return "great";
  if (points > 10) return "nice";
  if (points >= 0) return "ok";
  if (points === 0) return "zero";
  return null;
};

const getRaitingColor = (raiting: string | null) => {
  switch (raiting) {
    case "super":
      return "#0891B2"; // A vibrant turquoise
    case "great":
      return "#06B6D4"; // A lighter turquoise
    case "nice":
      return "#67E8F9"; // An even lighter turquoise
    case "ok":
      return "#A7F3D0"; // A very light turquoise
    case "zero":
      return "#ECFDF5"; // The lightest turquoise tint
    default:
      return "#292929"; // A dark gray for empty squares
  }
};
