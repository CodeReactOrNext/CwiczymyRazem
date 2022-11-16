const CategoryBox = ({ title }: { title: string }) => {
  return (
    <div className='m-6	flex w-52 flex-col items-center justify-center bg-second p-4 text-2xl text-tertiary '>
      <p className=' text-4xl text-main-opposed'> 0%</p>
      <p className=' text-center text-2xl'>{title}</p>
      <p>0:00</p>
      <button
        className={
          "uppercas  border-2 border-transparent bg-main p-1 px-3 text-center text-sm font-bold text-white hover:bg-main-100 "
        }>
        Wybierz
      </button>
    </div>
  );
};
export default CategoryBox;
