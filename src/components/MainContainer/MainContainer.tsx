import { HeadDecoration } from "components/HeadDecoration";
import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  title?: string;
  noBorder?: boolean;
}

const MainContainer = ({ children, title, noBorder }: MainContainerProps) => {
  return (
    <div className='relative lg:mt-16  overflow-visible rounded-md bg-second-600'>
      {!noBorder && (
        <div className='absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent'></div>
      )}

      {title && (
        <div className='relative pb-2 pt-8'>
          <HeadDecoration title={title} />
        </div>
      )}

      <div className='relative '>{children}</div>
    </div>
  );
};

export default MainContainer;
