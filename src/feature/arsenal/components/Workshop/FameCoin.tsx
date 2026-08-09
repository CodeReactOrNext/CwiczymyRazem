/**
 * The Fame coin, at the size the surrounding text runs at.
 *
 * Fame is spent all over the app and always wears this coin — reusing the same
 * asset here means the workshop's charge is recognised as the same currency the
 * player sees in the header, rather than read as another kind of part.
 */
export const FameCoin = ({ size = 18 }: { size?: number }) => (
  <img
    src='/images/coin.png'
    alt=''
    aria-hidden
    width={size}
    height={size}
    className='shrink-0 object-contain'
    style={{ width: size, height: size }}
  />
);
