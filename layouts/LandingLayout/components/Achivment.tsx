import { FaMedal, FaMarker } from "react-icons/fa";

export default function Achivment() {
  return (
    <div className='relative right-2 flex flex-row'>
      <div className='flex h-8 w-8 shrink-0  items-center justify-center bg-main text-white '>
        <FaMedal />
      </div>
      <div className='mx-2 self-center '>
        <p className=' text-sm text-white'>Najrzadsze</p>
        <div className='flex w-full flex-row flex-wrap gap-4'>
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
        </div>
      </div>
    </div>
  );
}
