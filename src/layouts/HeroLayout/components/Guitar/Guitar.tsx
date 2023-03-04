import LightningSVG from "public/static/images/svg/Lightning";
import LightningRevSVG from "public/static/images/svg/LightningRev";
import Image from "next/future/image";

const Guitar = () => {
  return (
    <div className='h-full w-full'>
      <div className='absolute left-[50%] -bottom-[10%] z-40 h-fit w-[20%] max-w-[100px] -translate-x-[50%] lg:bottom-[15%] lg:w-[35%] lg:max-w-max xl:w-[25%]'>
        <div className='shadow-animation absolute -bottom-[15%] aspect-square w-full rounded-full'></div>
        <Image
          className='hover-animation w-full'
          src='/static/images/guitar_red.png'
          width={366}
          height={1091}
          alt=''></Image>
        <div className='shake-animation absolute -bottom-[5%] -left-[100%] w-[65%] lg:-bottom-[15%]'>
          <LightningRevSVG className='origin-right rotate-[140deg] fill-tertiary-500 ' />
        </div>
        <div className='shake-animation absolute bottom-[5%] -right-[70%] w-[40%] lg:-bottom-[10%]'>
          <LightningSVG className='origin-left rotate-[110deg] fill-tertiary-500' />
        </div>
      </div>
    </div>
  );
};

export default Guitar;
