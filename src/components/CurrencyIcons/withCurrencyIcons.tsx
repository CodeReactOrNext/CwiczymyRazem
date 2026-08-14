import { cn } from "assets/lib/utils";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Points and Fame wear the same artwork everywhere in the app, so an amount
 * written in an article should be recognisable as the same currency the player
 * sees in the header. These helpers walk rendered text and put the coin in front
 * of every amount, which keeps the markdown itself plain strings.
 */

const CURRENCY_ART = {
  points: "/images/points.png",
  fame: "/images/coin.png",
} as const;

type Currency = keyof typeof CURRENCY_ART;

/** `+40 points`, `300 Fame`, `20 Fame a week`, `1 point per 3 minutes`. */
const AMOUNT = /([+-]?\d[\d,]*(?:\.\d+)?\s*(?:points?|fame))\b/gi;

/** A label that is nothing but the currency name, e.g. a `Fame::…` list title. */
const BARE_NAME = /^(points?|fame)$/i;

const currencyOf = (text: string): Currency =>
  /fame/i.test(text) ? "fame" : "points";

export const CurrencyIcon = ({
  currency,
  className,
}: {
  currency: Currency;
  className?: string;
}) => (
  <img
    src={CURRENCY_ART[currency]}
    alt=''
    aria-hidden
    className={cn(
      // `my-0` is load-bearing: inside `prose` (the wiki/blog article body)
      // Tailwind Typography gives every `img` a ~1.8em vertical margin, which
      // shoves the coin off its own text line and blows the line box open.
      // Its selector is wrapped in `:where()`, so a plain utility beats it.
      "mr-1 my-0 inline-block h-[1.1em] w-[1.1em] shrink-0 object-contain align-[-0.2em]",
      className,
    )}
  />
);

const withIcon = (text: string, key: string) => (
  <span
    key={key}
    data-currency={currencyOf(text)}
    className='whitespace-nowrap'>
    <CurrencyIcon currency={currencyOf(text)} />
    {text}
  </span>
);

const transformText = (text: string, keyPrefix: string): ReactNode => {
  if (BARE_NAME.test(text.trim())) return withIcon(text, keyPrefix);

  const parts = text.split(AMOUNT);
  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    index % 2 === 1 ? withIcon(part, `${keyPrefix}-${index}`) : part,
  );
};

/**
 * Returns the same tree with every points/Fame amount preceded by its icon.
 * Already-iconed spans and code are left alone, so it's safe to run on a node
 * whose children have been through it already (a list item wrapping a
 * paragraph, for instance).
 */
export const withCurrencyIcons = (
  node: ReactNode,
  keyPrefix = "currency",
): ReactNode => {
  if (typeof node === "string") return transformText(node, keyPrefix);

  if (Array.isArray(node)) {
    // Mapping turns static children into a dynamic list, so anything that comes
    // back as an element needs a key React can hold on to.
    return node.map((child, index) => {
      const key = `${keyPrefix}-${index}`;
      const transformed = withCurrencyIcons(child as ReactNode, key);

      return isValidElement(transformed) && transformed.key === null
        ? cloneElement(transformed, { key })
        : transformed;
    });
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{
      children?: ReactNode;
      "data-currency"?: string;
    }>;

    if (
      element.props["data-currency"] ||
      element.type === "code" ||
      element.type === "pre"
    ) {
      return element;
    }

    if (element.props.children === undefined) return element;

    return cloneElement(
      element,
      undefined,
      withCurrencyIcons(element.props.children, keyPrefix),
    );
  }

  return node;
};

/**
 * Markdown block elements an article writes currency amounts inside. Spread into
 * the MDX component map so prose gets the same icons the wiki components do.
 */
export const currencyProseComponents = {
  p: ({ children, ...props }: { children?: ReactNode }) => (
    <p {...props}>{withCurrencyIcons(children)}</p>
  ),
  li: ({ children, ...props }: { children?: ReactNode }) => (
    <li {...props}>{withCurrencyIcons(children)}</li>
  ),
  td: ({ children, ...props }: { children?: ReactNode }) => (
    <td {...props}>{withCurrencyIcons(children)}</td>
  ),
};
