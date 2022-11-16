/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import FireDouble from "public/static/images/svg/Fire_double";
import Lightning from "public/static/images/svg/Lightning";
import Button from "components/Button";
import LightningRev from "public/static/images/svg/LightningRev";

export default function HeroLayout({
  children,
  buttonOnClick,
}: {
  children: React.ReactElement;
  buttonOnClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className='grid h-full w-full grid-cols-1 grid-rows-2 gap-[20vh] lg:grid-cols-2 lg:grid-rows-1'>
      <div className='relative h-full w-full'>
        <div className='absolute bottom-0 h-full w-full'>
          <div className='relative h-full w-full'>
            <FireDouble className='absolute top-[60%] left-0 right-0 w-[110%] -translate-x-[7%] fill-second-500 sm:top-[50%] md:top-[50%] lg:-bottom-[45%] lg:top-auto lg:h-full xl:-bottom-[50%]' />
            <Lightning className='absolute top-[20%] right-[15%] w-[20vw] fill-tertiary-500 sm:-top-[10%] md:right-[10%] lg:right-[20%] lg:top-[12%] lg:w-[10vw] xl:top-[10%]' />
            <Lightning className='absolute bottom-0 right-[20%] w-[10vw] rotate-[110deg] fill-tertiary-500 sm:right-[35%] sm:w-[5vw] lg:right-[30%] lg:w-[5vw]' />
            <LightningRev className='absolute bottom-[5%] left-[15%] w-[20vw] rotate-[140deg] fill-tertiary-500 sm:left-[30%] sm:w-[15vw]  lg:left-[15%] lg:w-[8vw]' />
          </div>
          <div className='absolute left-[50%]  bottom-0 z-40 h-fit w-[25%] max-w-[100px] -translate-x-[50%] lg:bottom-[15%] lg:left-[47%] lg:max-w-max xl:left-[43%]'>
            <div className='shadow-animation absolute -bottom-[15%] aspect-square w-full rounded-full'></div>
            <img
              className='hover-animation h-full w-full'
              src='/static/images/guitar_red.png'
              alt='red guitar'
            />
          </div>
        </div>
        <span className='relative z-50 flex h-[50%] flex-col text-[20vw] font-medium leading-[0.7]  sm:text-[14vw]   lg:text-[8em]'>
          <p className='self-start pl-[10%] text-left text-tertiary-500'>
            ĆWICZYMY
          </p>
          <p className='self-end pr-[10%] text-[0.8em] font-bold text-second-500 '>
            RAZEM
          </p>
        </span>
      </div>
      <div
        className={`absolute h-full max-h-[1080px] w-full max-w-[1920px] bg-old-effect bg-cover bg-no-repeat lg:bg-old-effect-hr`}></div>
      <div className='z-10 flex flex-col items-center justify-center gap-6 xsm:flex-row lg:-mb-24 lg:flex-col xl:pr-8'>
        <span className='text-left text-[2.5vh] text-tertiary-500 xxs:text-[2.7vh] xsm:text-[2vh] md:text-2xl lg:text-right xl:text-3xl 2xl:text-4xl'>
          {children}
        </span>
        <Link href='/login'>
          <a>
            <Button onClick={buttonOnClick}>ĆWICZ Z NAMI!</Button>
          </a>
        </Link>
      </div>
    </div>
  );
}
