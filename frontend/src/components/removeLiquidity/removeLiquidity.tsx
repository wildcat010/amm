import "./removeLiquidity.css";
import { Tabs } from "radix-ui";

type RemoveLiquidityProps = {
  onRemoveLiquidityRefresh: () => Promise<void>;
};

function RemoveLiquidity({ onRemoveLiquidityRefresh }: RemoveLiquidityProps) {
  return (
    <>
      <div className="remove-liquidity-card"></div>
    </>
  );
}

export default RemoveLiquidity;
