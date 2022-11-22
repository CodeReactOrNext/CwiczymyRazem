import React from "react";

export default function Background({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <div
      className={`lg:clip-bg absolute left-0 top-0 bottom-0 w-full lg:mt-0 ${
        variant === "secondary" ? "bg-main-opposed-500" : "bg-second-500"
      } ${
        variant === "landing" ? "top-[50%] lg:top-0 lg:ml-[32.5%]" : ""
      }`}></div>
  );
}
