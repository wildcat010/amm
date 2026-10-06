import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "My AMM",
  projectId: "0011927d2b8a84a41cf94b5f4b9ae5ef",
  chains: [sepolia],
});
