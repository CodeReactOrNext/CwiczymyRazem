interface ReportCategoryWrapperProps {
  children: React.ReactNode;
  title: string;
}

const ReportCategoryWrapper = ({
  children,
  title,
}: ReportCategoryWrapperProps) => {
  return (
    <div className='flex flex-col justify-self-center p-2 text-xl   lg:text-2xl  '>
      <p className='content-box p-2 text-center text-xl text-mainText sm:text-2xl md:text-3xl'>
        {title}
      </p>
      {children}
    </div>
  );
};
export default ReportCategoryWrapper;
