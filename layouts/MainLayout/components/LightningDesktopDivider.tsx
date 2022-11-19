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
        variant === "landing"
          ? "left-[55%] h-full w-auto -translate-x-[50%]"
          : "left-0"
      }`}>
      <LightningSVG className='h-full w-auto fill-tertiary-500' />
    </div>
  );
}
