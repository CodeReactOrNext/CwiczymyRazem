import { Fragment } from "react";

/**
 * Renders a translated sentence whose `{{name}}` slots hold React nodes — a link,
 * a bold title, a chip — instead of plain text.
 *
 * Word order differs between languages, so a sentence like "completed {{step}} on
 * the {{roadmap}} roadmap" cannot be assembled from fragments in English order.
 * The translator moves the slots; this puts the nodes back where they landed.
 * A slot with no value is rendered as written, like `interpolate` does.
 */
export const Interpolate = ({
  text,
  values,
}: {
  text: string;
  values: Record<string, React.ReactNode>;
}) => {
  const parts = text.split(/(\{\{\w+\}\})/g);

  return (
    <>
      {parts.map((part, index) => {
        const slot = part.match(/^\{\{(\w+)\}\}$/);
        if (!slot) return part ? <Fragment key={index}>{part}</Fragment> : null;
        const name = slot[1];
        return (
          <Fragment key={index}>
            {name in values ? values[name] : part}
          </Fragment>
        );
      })}
    </>
  );
};
