import LightningThinSVG from "public/static/images/svg/Lightning_thin";
import React from "react";

export default function LightningDesktopDivider({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`pointer-events-none z-20 hidden h-full origin-bottom-left rotate-0 scale-[1.6] lg:right-0 lg:block ${
        variant === "landing" ? "absolute left-[33%] z-30 hidden" : ""
      }`}>
      <LightningThinSVG className={`h-full w-auto fill-tertiary-500`} />
    </div>
  );
}
