import Fire from "public/static/images/svg/Fire";

export default function Decoration() {
  return (
    <>
      <div className=' relative -z-10 flex h-0 justify-center fill-second sm:hidden '>
        <Fire className='  fill-red relative h-max w-[85vw] self-center ' />
      </div>
      <p className=' p-2  text-center text-2xl text-main-opposed sm:hidden '>
        Statystyki
      </p>
      <div className=' hidden justify-center sm:flex'>
        <div className=' relative -z-10 flex h-0 justify-center fill-second md:w-full  '>
          <Fire className=' fill-red relative h-max w-full max-w-[500px] self-center xl:max-w-none' />
        </div>
        <p className=' bg-tertiary p-2 px-12 text-center text-2xl text-main-opposed '>
          Statystyki
        </p>

        <div className=' relative  z-10 flex h-0 justify-center fill-second text-xl md:w-full  xl:max-w-none'>
          <Fire className=' fill-red relative h-max w-full max-w-[500px] self-center' />
        </div>
      </div>
    </>
  );
}