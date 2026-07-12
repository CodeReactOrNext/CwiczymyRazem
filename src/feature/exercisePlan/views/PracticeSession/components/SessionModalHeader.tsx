import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { FavoriteExerciseButton } from "./FavoriteExerciseButton";

interface SessionModalHeaderProps {
  exerciseTitle: string;
  exerciseId?: string;
  currentExerciseIndex: number;
  totalExercises: number;
  onClose: () => void;
}

export const SessionModalHeader = ({
  exerciseTitle,
  exerciseId,
  currentExerciseIndex,
  totalExercises,
  onClose,
}: SessionModalHeaderProps) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative pb-1 shadow-lg backdrop-blur-sm transition-all duration-300"
      )}>
      <div
        className={cn("absolute inset-0")}
        style={{
          background:
            "linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))",
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 4px), 0 100%)",
          opacity: 0.85,
        }}
      />

      <div
        className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent'
        style={{
          boxShadow: "0 1px 4px rgba(var(--primary-rgb), 0.4)",
        }}
      />

      <div className='relative z-10 flex h-14 items-center justify-between'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          className='relative z-10 ml-2 mr-1 shrink-0 transition-all duration-200 hover:bg-background/80 hover:shadow-md'>
          <X className='h-5 w-5' />
        </Button>

        <div className='relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2'>
          <h1 className='truncate text-[14px] font-bold tracking-tight text-foreground drop-shadow-md'>
            {exerciseTitle}
          </h1>
          {exerciseId && <FavoriteExerciseButton exerciseId={exerciseId} compact />}
        </div>

        <div className='relative z-10 mr-3 flex shrink-0 items-center gap-2'>
          <Badge variant='outline' className='shadow-sm'>
            {currentExerciseIndex + 1} of {totalExercises}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
