export default function LandingNav() {
  return (
    <div className='relative flex w-full justify-around  bg-tertiary py-3 text-xl uppercase text-second sm:text-3xl'>
      <button>Raportuj</button>
      <button className='z-50'>Ćwicz</button>
      <div className=' hidden md:block md:w-[150px] xl:w-[250px]'></div>
      <button>Raportuj</button>
      <button className='z-50'>Ćwicz</button>
    </div>
  );
}
