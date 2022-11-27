import React from "react";

interface Props {
  className?: string;
}

export default function OldEffect({ className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none fixed top-[50%] left-[50%] bottom-0 right-0 z-30 h-full w-full max-w-[1920px] -translate-x-[50%] -translate-y-[50%] bg-old-effect bg-cover bg-no-repeat lg:bg-old-effect-hr ${className}`}></div>
  );
}
