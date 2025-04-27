import type { ReactNode } from "react";

interface LevelIndicatorProps {
  children: ReactNode;
}

const LevelIndicator = ({ children }: LevelIndicatorProps) => {
  return (
    <div className='flex items-end gap-1'>
      <p className='text-xl font-medium leading-[0.8] text-mainText md:text-2xl lg:text-5xl'>
        {children}
      </p>
      <p className='text-sm font-medium text-tertiary-500 md:text-lg'>LVL</p>
    </div>
  );
};

export default LevelIndicator;
