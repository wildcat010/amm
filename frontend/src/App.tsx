import { useState, useEffect } from "react";
import WalletConnect from "./components/wallet/WalletConnect";
import "./App.css";

import Navigation from "./components/navigation/Navigation";
import PoolState from "./components/poolState/PoolState";

import { CONTRACTS } from "./contracts/addresses";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";

import AMMPairArtifact from "./../../contracts/out/AMMPair.sol/AMMPair.json";

export const AMMPairAbi = AMMPairArtifact.abi;

type PoolStats = {
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  userLpBalance: string;
};

function App() {
  const { address } = useAccount();

  const [poolStats, setPoolStats] = useState<PoolStats>({
    reserve0: "0",
    reserve1: "0",
    totalSupply: "0",
    userLpBalance: "0",
  });

  const { data: reserve0Data, refetch: refetchReserve0 } = useReadContract({
    address: CONTRACTS.sepolia.pair,
    abi: AMMPairArtifact.abi,
    functionName: "reserve0",
  });

  const { data: reserve1Data, refetch: refetchReserve1 } = useReadContract({
    address: CONTRACTS.sepolia.pair,
    abi: AMMPairArtifact.abi,
    functionName: "reserve1",
  });

  const { data: totalSupplyData, refetch: refetchTotalSupply } =
    useReadContract({
      address: CONTRACTS.sepolia.pair,
      abi: AMMPairArtifact.abi,
      functionName: "totalSupply",
    });

  const { data: userLpBalanceData, refetch: refetchUserLpBalance } =
    useReadContract({
      address: CONTRACTS.sepolia.pair,
      abi: AMMPairArtifact.abi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });

  useEffect(() => {
    setPoolStats({
      reserve0:
        typeof reserve0Data === "bigint" ? formatUnits(reserve0Data, 18) : "0",

      reserve1:
        typeof reserve1Data === "bigint" ? formatUnits(reserve1Data, 18) : "0",

      totalSupply:
        typeof totalSupplyData === "bigint"
          ? formatUnits(totalSupplyData, 18)
          : "0",

      userLpBalance:
        typeof userLpBalanceData === "bigint"
          ? formatUnits(userLpBalanceData, 18)
          : "0",
    });
  }, [reserve0Data, reserve1Data, totalSupplyData, userLpBalanceData]);

  return (
    <>
      <div className="header">
        <h1>Hello, Vite + React!</h1>
        <WalletConnect />
      </div>
      <div>
        <PoolState poolStats={poolStats} />
      </div>
      <div className="navigation">
        <Navigation />
      </div>
    </>
  );
}

export default App;
