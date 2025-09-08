const MobileHeaderWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => <div className='w-full md:hidden'>{children}</div>;

export default MobileHeaderWrapper;
