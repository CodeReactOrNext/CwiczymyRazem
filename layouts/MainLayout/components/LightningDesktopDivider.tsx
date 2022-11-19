import LightningSVG from "public/static/images/svg/Lightning";
import React from "react";

export default function LightningDesktopDivider({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 hidden h-[120%] w-fit rotate-0 lg:right-0 lg:block ${
        variant === "landing"
          ? "left-[55%] h-full w-auto -translate-x-[50%]"
          : "left-0"
      }`}>
      <LightningSVG className='h-full w-auto fill-tertiary-500' />
    </div>
  );
}
