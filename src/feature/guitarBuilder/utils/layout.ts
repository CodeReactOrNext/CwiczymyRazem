import type {
  BodyPart,
  DrawStep,
  GuitarLayout,
  HeadPart,
  NeckPart,
  Rect,
} from "../types/guitarBuilder.types";

const PADDING = 8;

/**
 * Places body, neck and headstock on one canvas. Template origin is the body
 * joint on the neck axis. The neck's fretboard overhang is stretched to end
 * exactly where the chosen body's original fretboard ended, and the headstock
 * is scaled so its nut matches the neck's nut width.
 */
export function layoutGuitar(
  body: BodyPart,
  neck: NeckPart,
  head: HeadPart,
): GuitarLayout {
  const bodyFretStart = body.fretStartX - body.jointX;
  const nutX = neck.nutX - neck.jointX;
  const headScale = neck.nutWidth / head.nutWidth;

  const steps: DrawStep[] = [
    {
      part: "body",
      src: { x: 0, y: 0, w: body.width, h: body.height },
      dest: { x: -body.jointX, y: -body.axisY, w: body.width, h: body.height },
    },
    {
      part: "neck",
      src: { x: 0, y: 0, w: neck.jointX, h: neck.height },
      dest: {
        x: bodyFretStart,
        y: -neck.axisY,
        w: -bodyFretStart,
        h: neck.height,
      },
    },
    {
      part: "neck",
      src: {
        x: neck.jointX,
        y: 0,
        w: neck.width - neck.jointX,
        h: neck.height,
      },
      dest: {
        x: 0,
        y: -neck.axisY,
        w: neck.width - neck.jointX,
        h: neck.height,
      },
    },
    {
      part: "head",
      src: { x: 0, y: 0, w: head.width, h: head.height },
      dest: {
        x: nutX - head.nutX * headScale,
        y: -head.axisY * headScale,
        w: head.width * headScale,
        h: head.height * headScale,
      },
    },
  ];

  const bounds = steps.reduce(
    (acc, { dest }) => ({
      x0: Math.min(acc.x0, dest.x),
      y0: Math.min(acc.y0, dest.y),
      x1: Math.max(acc.x1, dest.x + dest.w),
      y1: Math.max(acc.y1, dest.y + dest.h),
    }),
    { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
  );

  const shift = (r: Rect): Rect => ({
    ...r,
    x: r.x - bounds.x0 + PADDING,
    y: r.y - bounds.y0 + PADDING,
  });

  return {
    width: Math.ceil(bounds.x1 - bounds.x0 + PADDING * 2),
    height: Math.ceil(bounds.y1 - bounds.y0 + PADDING * 2),
    steps: steps.map((step) => ({ ...step, dest: shift(step.dest) })),
  };
}
