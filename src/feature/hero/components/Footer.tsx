import React from "react";

export const Footer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='absolute bottom-0 w-full'>
      <p className='text-center font-openSans text-[12px] text-mainText'>
        {children}
      </p>
    </div>
  );
};
