import Fire from "public/static/images/svg/Fire";

const HeadDecoration = ({ title }: { title: string }) => {
  return (
    <>
      <div className=' relative  flex h-0 justify-center fill-second sm:hidden '>
        <Fire className='relative w-[85vw] self-center ' />
      </div>
      <p className='  p-2 text-center text-2xl text-main-opposed  sm:hidden '>
        {title}
      </p>
      <div className=' hidden justify-center sm:flex'>
        <div className=' relative flex h-0 justify-center fill-second md:w-full  '>
          <Fire className='  relative h-max w-full self-center xl:max-w-none' />
        </div>
        <p className=' relative -top-[40px] bg-tertiary p-2 px-12 text-center text-3xl text-main-opposed radius-default '>
          {title}
        </p>

        <div className=' relative  flex h-0 scale-x-[-1] justify-center fill-second md:w-full  xl:max-w-none'>
          <Fire className='relative h-max w-full  self-center' />
        </div>
      </div>
    </>
  );
};

export default HeadDecoration;
