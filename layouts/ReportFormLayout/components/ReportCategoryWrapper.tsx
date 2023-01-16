interface ReportCategoryWrapperProps {
  children: React.ReactNode;
  title: string;
}

const ReportCategoryWrapper = ({
  children,
  title,
}: ReportCategoryWrapperProps) => {
  return (
    <div className='flex flex-col gap-1 justify-self-center p-2 text-xl sm:gap-2 md:gap-4 lg:text-2xl  '>
      <p className='text-center text-xl text-mainText sm:text-2xl md:text-3xl'>
        {title}
      </p>
      {children}
    </div>
  );
};
export default ReportCategoryWrapper;
