export const HeadDecoration = ({ title }: { title?: string }) => {
  return (
    <>
      <div className='hidden justify-center sm:flex'>
        {title && (
          <div className='mb-8 text-center'>
            <h2 className='inline-block border-b border-cyan-500/30 pb-2 text-2xl font-bold text-cyan-400'>
              {title}
            </h2>
          </div>
        )}
      </div>
    </>
  );
};
