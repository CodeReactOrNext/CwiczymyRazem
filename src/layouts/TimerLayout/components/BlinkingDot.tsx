import React from "react";

type BlinkingDotProps = {
  isActive: boolean;
};

const BlinkingDot: React.FC<BlinkingDotProps> = ({ isActive }) => {
  return (
    <div
      className={`h-2 w-2 rounded-full ${
        isActive ? "relative animate-ping bg-green-500" : "bg-red-500"
      }`}></div>
  );
};

export default BlinkingDot;
