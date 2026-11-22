import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { Minimize2,Minus, Plus } from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useImageHandling } from "../hooks/useImageHandling";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | StaticImageData;
  imageAlt: string;
}

const ImageModal = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
}: ImageModalProps) => {
  const {
    imageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
    setImageScale,
  } = useImageHandling();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setImageScale(4.5);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, setImageScale]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper zIndex='z-[10000000]'>
      <div className='flex h-full items-center justify-center bg-black'>
        <div className='absolute left-4 top-4 z-10 flex gap-2'>
          <Button
            variant='secondary'
            size='icon-sm'
            className='rounded-lg bg-background/40 backdrop-blur-sm'
            onClick={onClose}>
            <Minimize2 />
          </Button>
        </div>

        <div
          className={cn(
            "h-full w-full select-none overflow-hidden",
            "touch-none"
          )}>
          <div
            className='flex h-full w-full items-center justify-center transition-all duration-fast ease-out'
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${imageScale})`,
              transformOrigin: "center center",
              height: "100%",
              width: "100%",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            <Image
              src={imageSrc}
              alt={imageAlt}
              className='h-auto w-full max-w-full bg-white p-2'
              style={{ objectFit: "contain" }}
              width={700}
              height={200}
              priority
              quality={100}
              draggable={false}
            />
          </div>
        </div>

        {/* Mobile control buttons in modal */}
        <div className='absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-row gap-3'>
          <Button
            variant='secondary'
            size='icon-touch'
            onClick={handleZoomOut}
            disabled={imageScale <= 0.5}
            className='bg-background/40 backdrop-blur-sm'>
            <Minus />
          </Button>
          <Button
            variant='secondary'
            size='icon-touch'
            onClick={handleZoomIn}
            disabled={imageScale >= 8}
            className='bg-background/40 backdrop-blur-sm'>
            <Plus />
          </Button>
          <Button
            variant='secondary'
            size='icon-touch'
            onClick={() => {
              resetImagePosition();
              setPosition({ x: 0, y: 0 });
            }}
            className='bg-background/40 backdrop-blur-sm'>
            <Minimize2 />
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ImageModal;
