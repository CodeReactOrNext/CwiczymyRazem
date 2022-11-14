interface Props {
  className?: string;
  fill?: string;
}
const LightningRev = (props: Props) => (
  <svg
    viewBox='0 0 236.951 86.383'
    xmlns='http://www.w3.org/2000/svg'
    {...props}>
    <path
      style={{
        fillOpacity: 1,
        stroke: "none",
        strokeWidth: 0.79375,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        paintOrder: "markers fill stroke",
      }}
      d='m219.996 175.686 9.361-51.968-27.101 7.248 12.429-24.505-106.835 44.2 7.712-23.373-123.156 55.54 67.94-10.745-10.744 20.761 93.209-20.15-8.985 19.968z'
      transform='translate(7.594 -106.46)'
    />
  </svg>
);

export default LightningRev;
