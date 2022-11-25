interface Props {
  className?: string;
  fill?: string;
}

const LightningThinSVG = (props: Props) => (
  <svg
    className={props?.className}
    viewBox='0 0 79.178 215.746'
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
      d='m97.66 46.456 29.583 10.623-8.544 23.278 15.322-2.684-42.092 85.863 13.904 1.416-50.99 97.25 17.418-61.155-13.017 2.479 26.81-81.858-12.289 1.09z'
      transform='translate(-54.842 -46.456)'
    />
  </svg>
);

export default LightningThinSVG;
