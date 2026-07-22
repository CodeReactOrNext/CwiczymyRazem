"use client";

export const ProductDemo = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-28'>
      <div className='relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='relative mx-auto max-w-5xl'>
          <div className='relative overflow-hidden rounded-lg p-1.5 glass-card'>
            <div className='relative aspect-video overflow-hidden rounded-lg bg-zinc-950'>
              <video
                className='h-full w-full object-cover'
                autoPlay
                muted
                loop
                playsInline
                preload='none'
                poster='/images/video-poster.png'
                aria-label='Riff Quest product demo showing practice tracking in action'>
                <source src='/demo.webm' type='video/webm' />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
