import React from "react";

export default function Background({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`clip-bg-mobile lg:clip-bg mt-[15vh] h-full pt-[20%] lg:mt-0 ${
        variant === "secondary" ? "bg-main-opposed-500" : "bg-second-500"
      } ${
        variant === "landing"
          ? "mt-[46vh] h-[calc(100%_-_46vh)] md:h-full lg:ml-[32.5%]"
          : ""
      }`}></div>
  );
}
