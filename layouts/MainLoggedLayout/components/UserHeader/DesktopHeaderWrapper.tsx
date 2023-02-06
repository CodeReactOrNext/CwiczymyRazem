const DesktopHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => (
  <div
    className={`  hidden h-48 w-full  grid-cols-3 grid-rows-1 items-center justify-between bg-second p-4 text-xl text-tertiary-400 md:grid lg:px-8 `}>
    {children}
  </div>
);

export default DesktopHeaderWrapper;
