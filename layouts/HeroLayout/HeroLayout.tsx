/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import FireDoubleSVG from "public/static/images/svg/Fire_double";
import LightningSVG from "public/static/images/svg/Lightning";
import Button from "components/Button";
import LightningRevSVG from "public/static/images/svg/LightningRev";
import OldEffect from "components/OldEffect";

export default function HeroLayout({
  children,
  buttonOnClick,
}: {
  children: React.ReactElement;
  buttonOnClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className='grid h-full w-full grid-cols-1 grid-rows-2 gap-[20%] lg:grid-cols-2 lg:grid-rows-1'>
      <div className='relative h-full w-full'>
        <div className='absolute top-0 bottom-0 h-full w-full'>
          <FireDoubleSVG className='absolute top-[60%] left-0 right-0 w-[110%] -translate-x-[7%] fill-second-500 sm:top-[50%] md:top-[50%] lg:-bottom-[45%] lg:top-auto lg:h-full xl:-bottom-[50%]' />
        </div>
        <div className='relative z-50 mx-auto mt-14 flex h-fit w-fit flex-col text-[20vw] font-medium leading-[0.7] xs:text-[4.5rem] xsm:text-[5.5rem] md:mr-[15%] lg:mx-auto  lg:text-[7rem] xl:text-[9rem]'>
          <LightningSVG className='shake-animation absolute -bottom-[50%] -top-[25%] right-[0%] w-[45%] fill-tertiary-500' />
          <p className='self-start text-left text-white drop-shadow-lg'>
            ĆWICZYMY
          </p>
          <p className='-mr-[10%] self-end text-[0.8em] font-bold text-second-500 drop-shadow-lg'>
            RAZEM
          </p>
        </div>
        <OldEffect />
        <div className='h-full w-full'>
          <div className='absolute left-[50%] -bottom-[10%] z-40 h-fit w-[20%] max-w-[100px] -translate-x-[50%] lg:bottom-[15%] lg:left-[47%] lg:w-[35%] lg:max-w-max xl:left-[43%] xl:w-[25%]'>
            <div className='shadow-animation absolute -bottom-[15%] aspect-square w-full rounded-full'></div>
            <img
              className='hover-animation h-full w-full'
              src='/static/images/guitar_red.png'
              alt='red guitar'
            />
            <div className='shake-animation absolute -bottom-[5%] -left-[100%] w-[65%] lg:-bottom-[15%]'>
              <LightningRevSVG className='origin-right rotate-[140deg] fill-tertiary-500 ' />
            </div>
            <div className='shake-animation absolute bottom-[5%] -right-[70%] w-[40%] lg:-bottom-[10%]'>
              <LightningSVG className='origin-left rotate-[110deg] fill-tertiary-500' />
            </div>
          </div>
        </div>
      </div>
      <div className='z-30 flex flex-col items-center justify-center gap-6 xsm:flex-row lg:-mb-24 lg:flex-col xl:pr-8 '>
        <span className='text-left text-[min(5vw,2vh)] text-tertiary-500 xxs:text-[min(4vw,2vh)] xsm:text-[min(3vw,2vh)] md:text-2xl lg:text-right xl:text-3xl 2xl:text-4xl'>
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
