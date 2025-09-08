import { HeadDecoration } from "components/HeadDecoration";
import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  title?: string;
}

const MainContainer = ({ children, title }: MainContainerProps) => {
  return (
    <div className='relative mt-16 overflow-hidden'>
      {/* Background with gradient and pattern */}
      <div className='absolute inset-0 bg-gradient-to-br from-second-400/80 via-second-500/90 to-second-600/95 backdrop-blur-sm'></div>

      {/* Subtle pattern overlay */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px] opacity-5'></div>

      {/* Main container */}
      <div className='relative overflow-hidden rounded-3xl border border-second-200/20 shadow-2xl backdrop-blur-md'>
        {/* Top border accent */}
        <div className='absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent'></div>

        {/* Header section */}
        <div className='relative pb-4 pt-8'>
          <HeadDecoration title={title} />
        </div>

        {/* Content area */}
        <div className='relative z-20 px-6 pb-8'>
          {/* Content background */}
          <div className='relative overflow-hidden rounded-2xl border border-second-300/20 bg-second-500/30 backdrop-blur-sm'>
            {/* Inner glow effect */}
            <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent'></div>

            {/* Content */}
            <div className='relative p-6'>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
