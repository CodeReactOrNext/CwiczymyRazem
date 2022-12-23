const DesktopHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => (
  <div className='z-30  hidden h-48 w-full  grid-cols-3 grid-rows-1 items-center justify-between bg-second p-4 text-xl text-tertiary md:grid lg:px-8 '>
    {children}
  </div>
);

export default DesktopHeaderWrapper;
