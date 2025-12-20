import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { FaCompress, FaExpand } from "react-icons/fa";

interface ExerciseImageProps {
  image: string | StaticImageData;
  title: string;
  isMobileView: boolean;
  imageScale: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setImageModalOpen: (isOpen: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetImagePosition: () => void;
  setImageScale: (scale: number) => void;
}

export const ExerciseImage = ({
  image,
  title,
  isMobileView,
  imageScale,
  containerRef,
  setImageModalOpen,
  handleZoomIn,
  handleZoomOut,
  resetImagePosition,
  setImageScale,
}: ExerciseImageProps) => {
  if (!image) return null;

  if (isMobileView) {
    return (
      <div
        className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-xl border border-muted/30 bg-white/10 shadow-md transition-all duration-200 hover:shadow-lg'
        onClick={() => setImageModalOpen(true)}>
        <div className='relative aspect-[3.5/1] w-full'>
          <Image
            src={image}
            alt={title}
            className='h-full w-full object-contain'
            fill
            priority
            quality={80}
          />
          <div className='absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]'>
            <Button
              variant='secondary'
              size='sm'
              className='pointer-events-none opacity-90 shadow-lg'>
              <span className='mr-2'>Powiększ</span>
              <FaExpand className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative mb-2 w-full overflow-hidden rounded-xl bg-white/5 p-2 shadow-md backdrop-blur-[1px] transition-all duration-200 hover:shadow-lg'>
      <div
        ref={containerRef}
        className='relative min-h-[200px] w-full select-none overflow-hidden rounded-lg py-4 md:mx-auto md:max-w-[900px] md:py-8'
        style={{ touchAction: "none" }}>
        <motion.div
          className='flex h-full w-full items-center justify-center'
          style={{ height: "100%", width: "100%" }}
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          whileTap={{ cursor: "grabbing" }}
          initial={{ scale: isMobileView ? 4 : 2 }}
          animate={{ scale: imageScale }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            scale: { duration: 0.2 },
          }}
          whileHover={{ cursor: "grab" }}
          onDoubleClick={() => {
            if (imageScale > 2) {
              resetImagePosition();
            } else {
              setImageScale(4);
            }
          }}>
          <Image
            src={image}
            alt={title}
            className='h-auto w-full rounded-md bg-white'
            style={{ objectFit: "contain" }}
            width={700}
            height={200}
            priority
            quality={100}
            draggable={false}
          />
        </motion.div>
      </div>
      <div className='absolute right-6 top-6 flex gap-2'>
        <Button
          variant='secondary'
          size='icon'
          onClick={handleZoomOut}
          disabled={imageScale <= 0.5}
          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
          <Minus className='h-4 w-4' />
        </Button>
        <Button
          variant='secondary'
          size='icon'
          onClick={handleZoomIn}
          disabled={imageScale >= 5}
          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
          <Plus className='h-4 w-4' />
        </Button>
        <Button
          variant='secondary'
          size='icon'
          onClick={resetImagePosition}
          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
          <FaCompress className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};
