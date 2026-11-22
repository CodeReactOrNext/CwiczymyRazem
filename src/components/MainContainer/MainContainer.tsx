import { HeadDecoration } from "components/HeadDecoration";
import { PageShell } from "components/PageShell/PageShell";
import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  title?: string;
  /** No-op since the frame lost its top line; kept so existing call sites compile. */
  noBorder?: boolean;
}

const MainContainer = ({ children, title }: MainContainerProps) => {
  return (
    <PageShell className='relative'>
      {title && (
        <div className='relative pb-2 pt-8'>
          <HeadDecoration title={title} />
        </div>
      )}

      <div className='relative'>{children}</div>
    </PageShell>
  );
};

export default MainContainer;
