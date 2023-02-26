import React from "react";

const Footer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='absolute bottom-0 w-full'>
      <p className='text-center font-sans text-sm text-mainText'>{children}</p>
    </div>
  );
};

export default Footer;
