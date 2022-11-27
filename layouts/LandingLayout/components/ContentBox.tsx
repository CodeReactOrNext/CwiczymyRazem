import React from "react";

interface Props {
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

export default function ContentBox({ children, variant }: Props) {
  return (
    <section
      className={`relative z-40 flex h-full w-full items-center justify-center overflow-y-auto py-8 2xl:w-full 2xl:justify-center `}>
      <div
        className={`absolute top-0 bottom-0 left-0 right-0 my-auto flex justify-center overflow-x-hidden py-8 `}>
        {children}
      </div>
    </section>
  );
}
