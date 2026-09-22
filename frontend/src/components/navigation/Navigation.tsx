import "./Navigation.css";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

interface NavigationProps {
  swap: ReactNode;
  addLiquidity: ReactNode;
  removeLiquidity: ReactNode;
  defaultTab?: "swap" | "add" | "remove";
}

function Navigation() {
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
        </Tabs.List>

        <Tabs.Content className="nav-content" value="swap">
          SWAP
        </Tabs.Content>
        <Tabs.Content className="nav-content" value="add">
          LIQUIDITY
        </Tabs.Content>
        <Tabs.Content className="nav-content" value="remove">
          REMOVE LIQUIDITY
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

export default Navigation;
