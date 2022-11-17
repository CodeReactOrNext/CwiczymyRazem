interface Props {
  className?: string;
  fill?: string;
}

const LightningSVG = (props: Props) => (
  <svg
    className={props?.className}
    viewBox='0 0 136.199 215.746'
    xmlns='http://www.w3.org/2000/svg'>
    <path
      style={{
        fillOpacity: 1,
        stroke: "none",
        strokeWidth: 0.79375,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        paintOrder: "markers fill stroke",
      }}
      d='m128.497 46.456 50.885 10.623-14.695 23.278 26.355-2.684-72.404 85.863 23.917 1.416-87.713 97.25 29.964-61.155-22.392 2.479 46.117-81.858-21.138 1.09z'
      transform='translate(-54.842 -46.456)'
    />
  </svg>
);

export default LightningSVG;
