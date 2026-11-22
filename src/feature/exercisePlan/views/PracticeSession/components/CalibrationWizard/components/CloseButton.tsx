import { Button } from "assets/components/ui/button";
import { X } from "lucide-react";

/** The wizard's close control — a real button, not a bare glyph. */
export const CloseButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="shrink-0"
  >
    <X />
  </Button>
);
