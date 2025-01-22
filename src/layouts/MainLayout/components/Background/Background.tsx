import type { layoutVariant } from "layouts/MainLayout/MainLayout";
import React from "react";
interface BackgroundProps {
  variant: layoutVariant;
}

const Background = ({ variant }: BackgroundProps) => {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-full lg:mt-0  ${
        variant === "landing" ? "top-[50%] lg:top-0 lg:ml-[32.5%]" : ""
      }`}></div>
  );
};

export default Background;
