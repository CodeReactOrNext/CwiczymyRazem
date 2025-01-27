const SettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <div className='m-auto flex w-full flex-col bg-second-500 p-4 radius-default sm:w-[640px] '>
    {children}
  </div>
);

export default SettingsLayout;
