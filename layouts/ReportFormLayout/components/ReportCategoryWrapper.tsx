interface ReportCategoryWrapperProps {
  children: React.ReactNode;
  title: string;
}

export default function ReportCategoryWrapper({
  children,
  title,
}: ReportCategoryWrapperProps) {
  return (
    <div className='text-xlsm:gap-2 flex flex-col gap-1 justify-self-center md:gap-4 lg:text-2xl  '>
      <p className='text-center text-xl text-mainText sm:text-2xl md:text-3xl'>
        {title}
      </p>
      {children}
    </div>
  );
}
