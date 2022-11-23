import ReactDOM from "react-dom";

interface Props {
  children: React.ReactElement;
}
export default function RatingPopUp({ children }: Props) {
  const overlayEl = document.getElementById("overlays");
  return overlayEl
    ? ReactDOM.createPortal(
        <div className='absolute top-0 left-0 right-0 bottom-0 z-50 h-full w-full bg-black/30'>
          {children}
        </div>,
        overlayEl
      )
    : null;
}
