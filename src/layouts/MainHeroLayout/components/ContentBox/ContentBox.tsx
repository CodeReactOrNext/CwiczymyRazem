import type { layoutVariant } from "layouts/MainLayout/MainLayout";
import React from "react";
interface ContentBoxProps {
  variant: layoutVariant;
  children: React.ReactNode;
}

const ContentBox = ({ children, variant }: ContentBoxProps) => {
  return (
    <section
      className={`relative z-40 flex h-full w-full items-center justify-center overflow-y-auto py-8  2xl:w-full 2xl:justify-center ${
        variant === "landing" ? "z-0" : "lg:w-full"
      } `}>
      <div
        className={`absolute top-0 bottom-0 left-0 right-0 mb-4 grid grid-cols-1 items-center overflow-x-hidden py-8 xl:pt-24 sm:mb-0 ${
          variant === "landing" ? "h-[100%] overflow-y-hidden" : ""
        }`}>
        {children}
      </div>
    </section>
  );
};

export default ContentBox;
