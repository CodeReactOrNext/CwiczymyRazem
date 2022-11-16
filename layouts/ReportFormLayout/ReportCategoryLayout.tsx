interface Props {
  children: React.ReactNode;
  title: string;
}

export default function ReportCategoryLayout({ children, title }: Props) {
  return (
    <div className='flex flex-col gap-1 justify-self-center text-xl text-main-opposed-500 sm:gap-2 md:gap-4 lg:text-2xl'>
      <p className='text-center text-xl text-tertiary-500 sm:text-2xl md:text-3xl'>
        {title}
      </p>
      {children}
    </div>
  );
}
