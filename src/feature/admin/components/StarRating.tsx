import { cn } from "assets/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  max?: number;
}

export const StarRating = ({ rating, onRate, max = 10 }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHoverRating(null)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating !== null ? starValue <= hoverRating : starValue <= rating);
        
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRate(starValue);
            }}
            onMouseEnter={() => setHoverRating(starValue)}
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-sm"
          >
            <Star 
              className={cn(
                "h-3.5 w-3.5 transition-all duration-200",
                isFilled 
                  ? "fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
                  : "text-zinc-700 hover:text-zinc-500"
              )} 
            />
          </button>
        );
      })}
    </div>
  );
};
