"use client";


export const ProductDemo = () => {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="relative mx-auto max-w-5xl">
          <div className="relative rounded-lg glass-card p-1.5 overflow-hidden">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950">
                <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/images/video-poster.png"
                    aria-label="Riff Quest product demo showing practice tracking in action"
                >
                    <source src="/demo.webm" type="video/webm" />
                    Your browser does not support the video tag.
                </video>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
};
