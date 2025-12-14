import { DashboardContainer } from "components/Layout/DashboardContainer";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <div className='font-openSans mx-auto w-full max-w-6xl'>
    <DashboardContainer className='mx-4 sm:mx-8'>{children}</DashboardContainer>
  </div>
);

export default SettingsLayout;
