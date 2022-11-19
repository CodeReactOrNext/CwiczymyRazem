import React from "react";

export default function OldEffect({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none fixed top-0 left-0 bottom-0 h-full w-full max-w-[1920px] bg-old-effect bg-cover bg-no-repeat lg:bg-old-effect-hr 2xl:absolute ${className}`}></div>
  );
}
