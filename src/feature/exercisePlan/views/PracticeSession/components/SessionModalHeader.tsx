import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface SessionModalHeaderProps {
  exerciseTitle: string;
  currentExerciseIndex: number;
  totalExercises: number;
  onClose: () => void;
}

export const SessionModalHeader = ({
  exerciseTitle,
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

      <div className='relative z-10 flex h-[68px] items-center justify-between'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          className='relative z-10 ml-6 mr-2 transition-all duration-200 hover:bg-background/80 hover:shadow-md'>
          <X className='h-5 w-5' />
        </Button>

        <h1
          className='relative z-10 truncate text-lg font-bold tracking-tight text-foreground drop-shadow-md'
          style={{
            textShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}>
          {exerciseTitle}
        </h1>

        <div className='relative z-10 mr-6 flex items-center gap-2'>
          <Badge variant='outline' className='shadow-sm'>
            {currentExerciseIndex + 1} z {totalExercises}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
