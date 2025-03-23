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

        // Draw background
        context.fillStyle = getRaitingColor(raiting);
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add dot indicator for title or back date
        if (report?.exceriseTitle || report?.isDateBackReport) {
          context.fillStyle = "#ffffff";
          context.beginPath();
          if (report.isDateBackReport) {
            // Draw a ring for back date reports
            context.arc(canvas.width/2, canvas.height/2, 3, 0, 2 * Math.PI);
            context.stroke();
          } else {
            // Draw a filled dot for regular reports with title
            context.arc(canvas.width/2, canvas.height/2, 2, 0, 2 * Math.PI);
            context.fill();
          }
        }

        // Add hover effect
        if (isHovered && report) {
          context.strokeStyle = "#ffffff";
          context.lineWidth = 2;
          context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
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
      return "#EF4444"; // A vibrant red
    case "great":
      return "#F87171"; // A lighter red
    case "nice":
      return "#FCA5A5"; // An even lighter red
    case "ok":
      return "#FEE2E2"; // A very light red
    case "zero":
      return "#FEF2F2"; // The lightest red tint
    default:
      return "#1F2937"; // A dark gray for empty squares
  }
};
