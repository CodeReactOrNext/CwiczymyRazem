import type { layoutVariant } from "layouts/MainLayout/MainLayout";
import LightningThinSVG from "public/static/images/svg/Lightning_thin";
import React from "react";

const LightningDesktopDivider = ({ variant }: { variant: layoutVariant }) => {
  return (
    <div
      className={`pointer-events-none z-20 hidden h-full origin-bottom-left rotate-0 scale-[1.5] overflow-hidden lg:right-0 lg:block ${
        variant === "landing" ? "absolute left-[33%] z-50 hidden" : ""
      }`}>
      <LightningThinSVG className={`h-full w-auto fill-tertiary-500`} />
    </div>
  );
};
export default LightningDesktopDivider;
