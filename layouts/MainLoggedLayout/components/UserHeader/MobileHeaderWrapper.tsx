const MobileHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => (
  <div className=' grid w-full grid-rows-[1fr_0.5fr] items-center justify-between bg-second p-2 pt-10 text-xl text-tertiary-400 xs:pt-5 sm:text-2xl md:hidden'>
    {children}
  </div>
);

export default MobileHeaderWrapper;
