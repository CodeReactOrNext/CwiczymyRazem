import React from "react";

interface Props {
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

export default function ContentBox({ children, variant }: Props) {
  return (
    <section
      className={`absolute right-0 bottom-0 z-50 flex h-[70%] w-full items-stretch justify-center lg:h-[82%] 2xl:w-full 2xl:justify-center ${
        variant === "landing" ? "z-0 h-[90%]" : "lg:w-4/6 xl:w-5/6"
      }`}>
      {children}
    </section>
  );
}
