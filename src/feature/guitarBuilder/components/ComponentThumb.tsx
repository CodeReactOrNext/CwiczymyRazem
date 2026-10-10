import { cn } from "assets/lib/utils";

import { finishIconSrc, pickupIconSrc } from "../data/components";
import { getBody, getHead, getNeck, getSticker } from "../data/guitarParts";
import type { ComponentDef } from "../types/guitarBuilder.types";

export const ComponentThumb = ({
  def,
  className,
}: {
  def: ComponentDef;
  className?: string;
}) => {
  const box = cn("flex h-14 w-full items-center justify-center", className);
  switch (def.slot) {
    case "body":
      return (
        <span className={box}>
          <img
            src={getBody(def.partKey).src}
            alt=''
            className='h-full object-contain'
            draggable={false}
            loading='lazy'
          />
        </span>
      );
    case "neck":
      return (
        <span className={box}>
          <img
            src={getNeck(def.partKey).src}
            alt=''
            className='w-full object-contain'
            draggable={false}
            loading='lazy'
          />
        </span>
      );
    case "head":
      return (
        <span className={box}>
          <img
            src={getHead(def.partKey).src}
            alt=''
            className='h-12 object-contain'
            draggable={false}
            loading='lazy'
          />
        </span>
      );
    case "pickups":
      return (
        <span className={box}>
          <img
            src={pickupIconSrc(def.id)}
            alt=''
            // a hairline of light, so black covers don't sink into the card
            className='h-12 object-contain [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]'
            draggable={false}
            loading='lazy'
          />
        </span>
      );
    case "finish":
      return (
        <span className={box}>
          <img
            src={finishIconSrc(def.id)}
            alt=''
            className='h-full object-contain [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.45))]'
            draggable={false}
            loading='lazy'
          />
        </span>
      );
    case "pickguard":
      return (
        <span className={box}>
          <span
            className='block h-9 w-12 rounded-lg'
            style={{ backgroundColor: def.color }}
          />
        </span>
      );
    case "sticker":
      return (
        <span className={box}>
          <img
            src={getSticker(def.stickerKey).src}
            alt=''
            className='h-12 object-contain'
            draggable={false}
          />
        </span>
      );
  }
  return null;
};
