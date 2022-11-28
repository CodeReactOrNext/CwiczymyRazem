import Avatar from "components/Avatar";
import Logo from "components/Logo";

export default function UserHeaderMobile() {
  return (
    <div className='z-30 grid w-full grid-cols-2 grid-rows-[1fr_0.5fr] items-center justify-between bg-second  p-3 text-xl text-tertiary sm:text-2xl md:hidden'>
      <div className='flex flex-col items-start space-x-2 space-y-2 text-lg text-mainText'>
        <Logo />
        <Avatar />
        <button>Edytuj</button>
        <button>Wyloguj </button>
      </div>
      <div className=' text-lg sm:text-2xl'>
        <p className=' text-2xl  sm:text-4xl'>
          Cześć <span className='text-mainText'>User!</span>
        </p>
        <p>
          Miejsce w rankingu <span className='text-mainText'>6</span>
        </p>
        <p>
          Zdobyłeś punktów <span className='text-mainText'>360</span>
        </p>
      </div>
      <div className='col-span-2 flex flex-col items-center'>
        <p>
          Twój poziom <span className='text-4xl text-mainText'>35</span>
        </p>
        <div className=' flex w-full'>
          <p className=' relative left-3 z-10 text-sm'>
            lvl
            <span className='text-xl text-mainText'>35</span>
          </p>
          <div className='relative flex h-4 w-full items-center bg-main-opposed'>
            <div className='relative h-5 w-[20%] bg-main'></div>
          </div>
          <p className='relative right-3 text-sm'>
            lvl
            <span className='text-xl  text-mainText'>36</span>
          </p>
        </div>
        <p>340/550pkt</p>
      </div>
    </div>
  );
}
