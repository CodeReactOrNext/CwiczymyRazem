
interface YouTubeProps {
  id: string;
}

export const YouTube = ({ id }: YouTubeProps) => {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
};
