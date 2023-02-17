import {
  convertMsToHM,
  convertMsToHMObject,
} from "utils/converter/timeConverter";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  onClick: () => void;
}

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onClick,
}: CategoryBox) => {
  const timeObject = convertMsToHMObject(time);
  return (
    <div
      className={`m-2 flex w-28 flex-col items-center justify-center border-2 border-second-300 p-6 text-xl  radius-default xs:m-4 xs:text-2xl   xsm:w-40 md:m-6 md:w-44 ${
        chosen
          ? "border-tertiary-300 bg-tertiary text-main-opposed"
          : "bg-second text-tertiary"
      } `}>
      <p
        className={`text-2xl text-main-opposed xs:text-2xl ${
          chosen ? "text-main-900" : "text-main-opposed"
        } `}>
        {percent ? percent : 0}%
      </p>
      <p className=' text-center text-xl tracking-wide  xs:text-2xl md:text-3xl'>
        {title}
      </p>
      <p className='tracking-wide	 text-main-opposed	'>
        {timeObject.hours}:{timeObject.minutes}
      </p>
      {!chosen && (
        <button
          onClick={onClick}
          className={
            "uppercas border-2 border-transparent bg-main-900  p-1 px-3 text-center text-sm font-bold text-mainText radius-default hover:bg-main-100 "
          }>
          Wybierz
        </button>
      )}
    </div>
  );
};
export default CategoryBox;
