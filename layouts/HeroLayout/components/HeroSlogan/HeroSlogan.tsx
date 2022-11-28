import LightningSVG from "public/static/images/svg/Lightning";

export default function HeroSlogan() {
  return (
    <div className='relative z-50 mx-auto mt-14 flex h-fit w-fit flex-col text-[20vw] font-medium leading-[0.7] xs:text-[4.5rem] xsm:text-[5.5rem] md:mr-[15%] lg:mx-auto  lg:text-[7rem] 2xl:text-[9rem]'>
      <LightningSVG className='shake-animation absolute -bottom-[50%] -top-[25%] right-[0%] w-[45%] fill-tertiary-500' />
      <p className='self-start text-left text-mainText drop-shadow-lg'>ĆWICZYMY</p>
      <p className='-mr-[10%] self-end text-[0.8em] font-bold text-second-500 drop-shadow-lg'>
        RAZEM
      </p>
    </div>
  );
}
