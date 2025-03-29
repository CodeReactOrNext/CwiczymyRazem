import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { Minus, Plus } from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useEffect } from "react";
import { FaCompress } from "react-icons/fa";

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

  useEffect(() => {
    if (isOpen) {
      setImageScale(4.5);
    }
  }, [isOpen, setImageScale]);

  if (!isOpen) return null;

  return (
    <ModalWrapper zIndex='z-[10000000]'>
      <div className='flex h-full items-center justify-center bg-black'>
        <div className='absolute left-4 top-4 z-10 flex gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='rounded-full bg-background/40 backdrop-blur-sm'
            onClick={onClose}>
            <FaCompress className='h-4 w-4' />
          </Button>
        </div>

        <div
          className={cn(
            "h-full w-full select-none overflow-hidden",
            "touch-none"
          )}>
          <div
            className='flex h-full w-full items-center justify-center transition-all duration-100 ease-out'
            style={{
              transform: ` scale(${imageScale})`,
              transformOrigin: "center center",
              height: "100%",
              width: "100%",
            }}>
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
            size='sm'
            onClick={handleZoomOut}
            disabled={imageScale <= 0.5}
            className='h-12 w-12 rounded-full bg-background/40 backdrop-blur-sm'>
            <Minus className='h-5 w-5' />
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={handleZoomIn}
            disabled={imageScale >= 8}
            className='h-12 w-12 rounded-full bg-background/40 backdrop-blur-sm'>
            <Plus className='h-5 w-5' />
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={resetImagePosition}
            className='h-12 w-12 rounded-full bg-background/40 backdrop-blur-sm'>
            <FaCompress className='h-5 w-5' />
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ImageModal;
