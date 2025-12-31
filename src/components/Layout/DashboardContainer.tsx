import { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
  className?: string;
}

export const DashboardContainer = ({
  children,
  className = "",
}: DashboardContainerProps) => {
  return (
    <div className={`bg-second-600 radius-default ${className}`}>
      <div className='mt-6 space-y-6 p-4 md:p-6'>
          <div
            className='relative z-10'>
            <div className='space-y-6'>{children}</div>
          </div>
      </div>
    </div>
  );
};
