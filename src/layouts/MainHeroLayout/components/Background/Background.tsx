import React from "react";
import { layoutVariant } from "layouts/MainLayout/MainLayout";
interface BackgroundProps {
  variant: layoutVariant;
}

const Background = ({ variant }: BackgroundProps) => {
  return (
    <div
      className={`lg:clip-bg absolute left-0 top-0 bottom-0 w-full lg:mt-0 ${
        variant === "secondary" ? "bg-main-opposed-bg" : "bg-second-500"
      } ${
        variant === "landing" ? "top-[50%] lg:top-0 lg:ml-[32.5%]" : ""
      }`}></div>
  );
};

export default Background;
