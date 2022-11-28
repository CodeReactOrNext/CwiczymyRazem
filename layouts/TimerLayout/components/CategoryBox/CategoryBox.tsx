interface CategoryBox {
  title: string;
  chosen?: boolean;
}

const CategoryBox = ({ title, chosen }: CategoryBox) => {
  return (
    <div
      className={`m-2 flex w-28 flex-col items-center justify-center p-2 text-xl xs:m-4 xs:p-4 xs:text-2xl md:m-6 md:w-52 ${
        chosen ? "bg-tertiary text-main-opposed" : "bg-second text-tertiary"
      } `}>
      <p
        className={`text-2xl text-main-opposed xs:text-4xl ${
          chosen ? "text-main" : "text-main-opposed"
        } `}>
        0%
      </p>
      <p className=' text-center text-xl xs:text-2xl'>{title}</p>
      <p>0:00</p>
      {!chosen && (
        <button
          className={
            "uppercas  border-2 border-transparent bg-main p-1 px-3 text-center text-sm font-bold text-mainText hover:bg-main-100 "
          }>
          Wybierz
        </button>
      )}
    </div>
  );
};
export default CategoryBox;
