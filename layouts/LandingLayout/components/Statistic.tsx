import { FaClock } from "react-icons/fa";

export default function Statistic() {
  return (
    <div className='relative right-2 flex flex-row'>
      <div className='flex h-8  w-8 shrink-0  items-center justify-center bg-main text-white'>
        <FaClock />
      </div>
      <p className='mx-2 self-center text-main-opposed'>
        Łącznie spędziłeś na ćwiczeniach:
        <span className='text-white'> 21:32h</span>
      </p>
    </div>
  );
}
