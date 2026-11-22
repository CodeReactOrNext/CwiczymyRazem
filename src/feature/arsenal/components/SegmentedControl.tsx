import { cn } from "assets/lib/utils";
import {
  Segment,
  SegmentGroup as BaseSegmentGroup,
} from "components/SegmentedControl/SegmentedControl";
import type { ComponentProps } from "react";

/**
 * The app's segmented control on the Arsenal's own surface: the Dex,
 * Commissions and Case Shop toolbars sit on Arsenal materials, so the tray
 * takes the section colour instead of the page's zinc.
 */
export const SegmentGroup = ({
  className,
  ...props
}: ComponentProps<typeof BaseSegmentGroup>) => (
  <BaseSegmentGroup
    className={cn("bg-arsenal-section", className)}
    {...props}
  />
);

export { Segment };
