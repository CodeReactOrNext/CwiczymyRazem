const DesktopHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => <div className='hidden w-full md:block'>{children}</div>;

export default DesktopHeaderWrapper;
