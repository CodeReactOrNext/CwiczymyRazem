import LightningSVG from "public/static/images/svg/Lightning";
import React from "react";

export default function LightningDesktopDivider({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`pointer-events-none hidden h-full origin-bottom-left rotate-0 scale-[1.3] lg:right-0 lg:block ${
        variant === "landing" ? "absolute left-[32%] z-40 hidden" : ""
      }`}>
      <LightningSVG className={`h-full w-auto fill-tertiary-500`} />
    </div>
  );
}
