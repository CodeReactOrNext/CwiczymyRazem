import ReactTooltip from "react-tooltip";
import styles from "./tooltip.module.css";

const ToolTip = () => {
  return <ReactTooltip className={styles.toolTipStyle} border />;
};
export default ToolTip;
