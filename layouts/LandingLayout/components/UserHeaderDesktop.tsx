import Avatar from "components/Avatar";
import Logo from "components/Logo";
import Lightning from "public/static/images/svg/Lightning";

export default function UserHeaderDesktop() {
  return (
    <div className='z-30  mb-4  hidden h-48 w-full  grid-cols-3 grid-rows-1 items-center justify-between bg-second p-4 text-xl text-tertiary md:grid lg:px-8 '>
      <div className='flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-10'>
          <div className=' lg:mr-4'>
            <Logo />
            <Avatar />
            <div className='mt-3 text-base text-white'>
              <button>Edytuj</button>
              <button className='ml-3'>Wyloguj </button>
            </div>
          </div>
          <div className='text-base  lg:text-xl xl:text-2xl'>
            <p className='text-lg lg:text-xl  xl:text-xl  '>
              Cześć <span className='text-white'>User!</span>
            </p>
            <p>
              Miejsce w rankingu <span className='text-white'>6</span>
            </p>
            <p>
              Zdobyłeś punktów <span className='text-white'>360000000</span>
            </p>
          </div>
        </div>
      </div>
      <div className='relative flex flex-col '>
        <Lightning className='relative bottom-[-150px] h-72 fill-tertiary xl:bottom-[-240px] xl:h-96' />
        <img
          className='hover-animation relative bottom-[100px] z-50  m-auto w-[80px] xl:w-[120px] '
          src='/static/images/guitar_blue.png'
          alt='blue guitar'
        />
      </div>
      <div className=' flex w-64 flex-col items-center justify-self-end xl:w-80'>
        <p>
          Twój poziom <span className='text-4xl text-white'>35</span>
        </p>
        <div className=' flex w-full'>
          <p className=' relative left-3 z-10 text-sm'>
            lvl
            <span className='text-xl text-white'>35</span>
          </p>
          <div className='relative flex h-4 w-full items-center bg-main-opposed'>
            <div className='relative h-5 w-[20%] bg-main'></div>
          </div>
          <p className='relative right-3 text-sm'>
            lvl
            <span className='text-xl  text-white'>36</span>
          </p>
        </div>
        <p>340/550pkt</p>
      </div>
    </div>
  );
}
