const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='absolute left-0 top-0 bottom-0 flex w-full flex-col items-center overflow-y-auto bg-main-opposed-500 lg:mt-0'>
      {children}
    </div>
  );
};

export default Wrapper;
