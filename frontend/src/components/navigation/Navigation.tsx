import "./Navigation.css";
import { Tabs } from "radix-ui";
import AddLiquidity from "../addLiquidity/AddLiquidity";
import Swap from "../swap/swap";
import RemoveLiquidity from "../removeLiquidity/removeLiquidity";
import GetTokens from "../getTokens/getTokens";

type NavigationProps = {
  onLiquidityAdded: () => Promise<void>;
  onSwapRefresh: () => Promise<void>;
  onRemoveLiquidityRefresh: () => Promise<void>;
};

function Navigation({
  onLiquidityAdded,
  onSwapRefresh,
  onRemoveLiquidityRefresh,
}: NavigationProps) {
  return (
    <>
      <Tabs.Root className="nav-root" defaultValue="swap">
        <Tabs.List className="nav-tabs" aria-label="Pool actions">
          <Tabs.Trigger className="nav-tab" value="swap">
            Swap
          </Tabs.Trigger>
          <Tabs.Trigger className="nav-tab" value="add">
            Add liquidity
          </Tabs.Trigger>
          <Tabs.Trigger className="nav-tab" value="remove">
            Remove liquidity
          </Tabs.Trigger>
          <Tabs.Trigger className="nav-tab" value="getTokens">
            Get MTKA & MTKB
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="nav-content" value="swap">
          <Swap onSwapRefresh={onSwapRefresh} />
        </Tabs.Content>
        <Tabs.Content className="nav-content" value="add">
          <AddLiquidity onLiquidityAdded={onLiquidityAdded} />
        </Tabs.Content>
        <Tabs.Content className="nav-content" value="remove">
          <RemoveLiquidity
            onRemoveLiquidityRefresh={onRemoveLiquidityRefresh}
          />
        </Tabs.Content>
        <Tabs.Content className="nav-content" value="getTokens">
          <GetTokens />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

export default Navigation;
