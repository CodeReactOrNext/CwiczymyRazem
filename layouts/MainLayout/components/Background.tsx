import React from "react";

export default function Background({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`lg:clip-bg absolute left-0 top-0 bottom-0 h-[100%] w-full lg:mt-0 ${
        variant === "secondary" ? "bg-main-opposed-500" : "bg-second-500"
      } ${
        variant === "landing"
          ? "mt-[46vh] h-[calc(100%_-_46vh)] md:h-full lg:ml-[32.5%]"
          : ""
      }`}></div>
  );
}
