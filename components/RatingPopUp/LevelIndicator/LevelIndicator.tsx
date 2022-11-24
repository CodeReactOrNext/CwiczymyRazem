export default function LevelIndicator({
  children,
  position,
}: {
  children: string;
  position: "left" | "right";
}) {
  return (
    <div
      className={`absolute flex items-end gap-1
    ${position === "left" ? "-left-10" : "-right-6"}`}>
      <p className='text-sm font-medium text-tertiary-500 md:text-lg'>LVL</p>
      <p className='text-2xl font-medium leading-[0.8]  text-white md:text-5xl'>
        {children}
      </p>
    </div>
  );
}
