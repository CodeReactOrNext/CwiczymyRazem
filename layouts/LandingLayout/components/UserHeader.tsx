import Avatar from "components/Avatar";

export default function UserHeader() {
  return (
    <div className='z-10 grid   w-full grid-cols-2 grid-rows-2 justify-between  bg-second p-3 text-xl text-tertiary'>
      <div className='space-x-2 space-y-2 text-white'>
        <Avatar />
        <button>Edytuj</button>
        <button>Wyloguj </button>
      </div>
      <div className=' text-lg'>
        <p>Cześć user!</p>
        <p>
          Miejsce w rankingu <span className='text-white'>6</span>
        </p>
        <p>
          Zdobyłeś punktów <span className='text-white'>360</span>
        </p>
      </div>
      <div className='col-span-2 flex flex-col items-center'>
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
