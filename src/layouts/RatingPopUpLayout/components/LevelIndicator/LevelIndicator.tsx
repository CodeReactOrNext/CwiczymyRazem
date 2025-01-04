interface LevelIndicatorProps {
  children: number;
}
const LevelIndicator = ({ children }: LevelIndicatorProps) => {
  return (
    <div
      className={` flex items-end gap-1
      `}>
      <p className='text-2xl font-medium leading-[0.8]  text-mainText md:text-5xl'>
        {children}
      </p>
      <p className='font-medium text-tertiary-500 text-lg'>LVL</p>
    </div>
  );
};

export default LevelIndicator;
