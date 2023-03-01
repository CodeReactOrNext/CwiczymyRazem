import React from "react";
import { layoutVariant } from "layouts/MainLayout/MainLayout";
interface ContentBoxProps {
  variant: layoutVariant;
  children: React.ReactNode;
}

const ContentBox = ({ children, variant }: ContentBoxProps) => {
  return (
    <section
      className={`relative  flex h-full w-full items-center justify-center overflow-y-auto  2xl:w-full 2xl:justify-center ${
        variant === "secondary" ? "bg-main-opposed-bg" : "bg-second-500"
      }`}>
      <div className='absolute top-0 bottom-0 left-0 right-0 z-40 mb-4 grid grid-cols-1 items-center overflow-x-hidden py-12 sm:mb-0 xl:pt-24'>
        {children}
      </div>
    </section>
  );
};

export default ContentBox;
