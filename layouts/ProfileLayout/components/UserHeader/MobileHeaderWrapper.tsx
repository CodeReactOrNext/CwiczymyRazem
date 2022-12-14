const MobileHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => (
  <div className='z-30 grid  w-full grid-rows-[1fr_0.5fr] items-center justify-between bg-second  p-3 text-xl text-tertiary sm:text-2xl md:hidden'>
    {children}
  </div>
);

export default MobileHeaderWrapper;
