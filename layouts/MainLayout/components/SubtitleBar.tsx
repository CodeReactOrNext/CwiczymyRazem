import LightningRevSVG from "public/static/images/svg/LightningRev";
import React, { ReactNode } from "react";

interface Props {
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

export default function SubtitleBar({ variant, children }: Props) {
  return (
    <div className='absolute top-[10%] right-0 z-50 flex h-1/5 w-full items-center justify-end lg:top-20 lg:h-20'>
      <LightningRevSVG
        className={`absolute top-0 -right-10 bottom-0 m-auto min-h-full w-[130%] fill-tertiary-500 sm:rotate-x-50 lg:hidden ${
          variant === "landing" ? "top-[40vh] sm:top-[42vh] " : ""
        }`}
      />
      <span
        className={`absolute top-[40%] h-full w-full p-6 text-right text-[5vw] font-medium text-second-500 lg:top-0 lg:w-9/12 lg:bg-tertiary-500 lg:text-left lg:text-3xl xl:text-4xl ${
          variant === "landing"
            ? "top-[37vh] xxs:top-[38vh] xsm:top-[39vh] sm:top-[39.5vh] lg:w-5/12"
            : ""
        }`}>
        {children}
      </span>
    </div>
  );
}
