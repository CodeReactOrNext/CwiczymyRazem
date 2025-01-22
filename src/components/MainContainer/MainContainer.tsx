import HeadDecoration from "layouts/ProfileLayout/components/HeadDecoration";
import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  title: string;
}

const MainContainer = ({ children, title }: MainContainerProps) => {
  return (
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={title} />
      <div className='relative z-20'>{children}</div>
    </div>
  );
};

export default MainContainer;
