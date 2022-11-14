import Image from "next/image";
import FireDouble from "../../../public/static/images/Fire_double";
import guitar from "../../../public/static/images/guitar_red.png";
import Lightning from "../../../public/static/images/Lightning";
import LightningRev from "../../../public/static/images/LightningRev";
import Button from "../../Button";

export default function HeroSection() {
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
          <div className='absolute left-[50%] bottom-0 z-40 h-fit w-[25%] max-w-[100px] -translate-x-[50%] lg:bottom-[15%] lg:left-[47%] lg:max-w-max xl:left-[43%]'>
            <div className='absolute -bottom-[15%] aspect-square w-full rounded-full bg-black rotate-x-80'></div>
            <Image
              className='h-full w-full after:h-full after:w-full after:bg-black'
              src={guitar}
              alt='red guitar'
              height={1091}
              width={366}
            />
          </div>
        </div>
        <span className='relative z-50 flex h-[50%] flex-col px-8 text-[20vw] font-medium leading-[0.7] sm:px-28 sm:text-[14vw] lg:px-12 lg:text-[8em]'>
          <p className='self-start text-left text-tertiary-500'>ĆWICZYMY</p>
          <p className='self-end text-[0.8em] font-bold text-second-500 '>
            RAZEM
          </p>
        </span>
      </div>
      <div className='z-10 flex flex-col items-center justify-center gap-6 sm:flex-row lg:-mb-24 lg:flex-col lg:pr-8'>
        <span className='text-left text-[6vw] text-tertiary-500 md:text-2xl lg:text-right xl:text-3xl 2xl:text-4xl'>
          <p>Pnij się po szczeblach rankingu.</p>
          <p>Gromadź statystyki swoich ćwiczeń.</p>
          <p>Otrzymuj punkty za swoje codzinne ćwiczenia</p>
          <p>Dołącz do nas i zmotywuj się do grania na gitarze!</p>
        </span>
        <Button>ĆWICZ Z NAMI!</Button>
      </div>
    </div>
  );
}
