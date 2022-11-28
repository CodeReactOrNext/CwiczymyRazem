import React from "react";

const Footer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='absolute bottom-0 w-full'>
      <p className='text-center text-sm text-tertiary'>{children}</p>
    </div>
  );
};

export default Footer;
