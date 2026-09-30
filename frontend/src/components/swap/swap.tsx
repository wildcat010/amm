import "./swap.css";
import { Tabs } from "radix-ui";
import AddLiquidity from "../addLiquidity/AddLiquidity";

type SwapProps = {
  onSwapRefresh: () => Promise<void>;
};

function Swap({ onSwapRefresh }: SwapProps) {
  return (
    <>
      <div className="swap-card"></div>
    </>
  );
}

export default Swap;
