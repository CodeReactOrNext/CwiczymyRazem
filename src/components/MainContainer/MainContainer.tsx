import React from "react";
import { motion } from "framer-motion";
import HeadDecoration from "layouts/ProfileLayout/components/HeadDecoration";

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
