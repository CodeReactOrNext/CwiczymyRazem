import { DashboardContainer } from "components/Layout/DashboardContainer";
import { WikiSidebar } from "feature/wiki/components/WikiSidebar";
import type { WikiSection } from "lib/wiki";
import type { ReactNode } from "react";

interface WikiLayoutProps {
  sections: WikiSection[];
  children: ReactNode;
}

const WikiLayout = ({ sections, children }: WikiLayoutProps) => (
  <div className='font-sans mx-auto w-full max-w-[1700px]'>
    <DashboardContainer className='mx-4 sm:mx-8'>
      <div className='flex flex-col md:flex-row gap-8 items-start'>
        <WikiSidebar sections={sections} />
        <div className='flex-1 min-w-0 max-w-full'>{children}</div>
      </div>
    </DashboardContainer>
  </div>
);

export default WikiLayout;
