import "./removeLiquidity.css";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";

import { CONTRACTS } from "../../contracts/addresses";
import AMMPairArtifact from "./../../../../contracts/out/AMMPair.sol/AMMPair.json";

type RemoveLiquidityProps = {
  onRemoveLiquidityRefresh: () => Promise<void>;
};

type tokenBalanceObject = {
  mtka: number;
  mtkb: number;
};

function RemoveLiquidity({ onRemoveLiquidityRefresh }: RemoveLiquidityProps) {
  const [percentage, setPercentage] = useState(0);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [receiveToken, setReceiveToken] = useState<tokenBalanceObject>({
    mtka: 0,
    mtkb: 0,
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const isRemovingLiquidity = status !== "";

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

  const handlePercentageClick = (value: number) => {
    setPercentage(value);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPercentage(Number(event.target.value));
  };

  const handleRemoveLiquidity = async () => {
    try {
      if (percentage <= 0) {
        throw new Error("Percentage must be greater than 0");
      }
      if (!userLpBalanceData) {
        throw new Error("LP balance not available");
      }
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      setError("");
      const liquidityToRemove =
        ((userLpBalanceData as bigint) * BigInt(percentage)) / 100n;

      const removeLiquidityTx = await writeContractAsync({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: "removeLiquidity",
        args: [liquidityToRemove],
      });

      // Wait for the swap transaction
      setStatus("Confirming transaction...");

      await publicClient?.waitForTransactionReceipt({
        hash: removeLiquidityTx,
      });
      setStatus("");

      await onRemoveLiquidityRefresh();
      await refetchUserLpBalance();
      await refetchTotalSupply();
      await refetchReserve0();
      await refetchReserve1();

      setPercentage(0);
    } catch (err) {
      console.error(err);

      setError("Failed to remove liquidity");
      setStatus("");
    }
  };

  const handleRemoveLiquidityClick = async () => {
    await handleRemoveLiquidity();
  };

  useEffect(() => {
    const userLpBalanceDataF: any =
      typeof userLpBalanceData === "bigint"
        ? formatUnits(userLpBalanceData, 18)
        : 0;
    const liquidityToRemove = userLpBalanceDataF * (percentage / 100);
    const reserve0DataF: any =
      typeof reserve0Data === "bigint" ? formatUnits(reserve0Data, 18) : 0;
    const reserve1DataF: any =
      typeof reserve1Data === "bigint" ? formatUnits(reserve1Data, 18) : 0;
    const totalSupplyDataF: any =
      typeof totalSupplyData === "bigint"
        ? formatUnits(totalSupplyData, 18)
        : 0;

    if (totalSupplyDataF === 0) {
      setReceiveToken({
        mtka: 0,
        mtkb: 0,
      });
      return;
    }

    const amount0 = liquidityToRemove * (reserve0DataF / totalSupplyDataF);
    const amount1 = liquidityToRemove * (reserve1DataF / totalSupplyDataF);

    setReceiveToken({ mtka: amount0, mtkb: amount1 });
  }, [
    percentage,
    userLpBalanceData,
    reserve0Data,
    reserve1Data,
    totalSupplyData,
  ]);

  return (
    <>
      <div className="remove-liquidity">
        <div className="remove-liquidity-header">
          <span>Amount to withdraw</span>
          <span>{percentage}%</span>
        </div>

        <input
          className="remove-liquidity-slider"
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={handleSliderChange}
        />

        <div className="remove-liquidity-percentages">
          <button
            className={percentage === 25 ? "active" : ""}
            onClick={() => handlePercentageClick(25)}
          >
            25%
          </button>
          <button
            className={percentage === 50 ? "active" : ""}
            onClick={() => handlePercentageClick(50)}
          >
            50%
          </button>
          <button
            className={percentage === 75 ? "active" : ""}
            onClick={() => handlePercentageClick(75)}
          >
            75%
          </button>
          <button
            className={percentage === 100 ? "active" : ""}
            onClick={() => handlePercentageClick(100)}
          >
            100%
          </button>
        </div>

        <div className="remove-liquidity-receive">
          <span>You'll receive</span>

          <div className="remove-liquidity-amounts">
            <span>{receiveToken.mtka.toFixed(2)} MTKA</span>
            <span>{receiveToken.mtkb.toFixed(2)} MTKB</span>
          </div>
        </div>

        {error && <div className="liquidity-error">{error}</div>}

        <button
          className="remove-liquidity-button"
          disabled={isRemovingLiquidity}
          onClick={() => handleRemoveLiquidityClick()}
        >
          {isRemovingLiquidity ? status : "Remove Liquidity"}
        </button>

        <div className="remove-liquidity-balance">
          Your LP balance:{" "}
          <span>
            {" "}
            {userLpBalanceData !== undefined
              ? Number(formatUnits(userLpBalanceData as bigint, 18)).toFixed(8)
              : "0"}{" "}
            AMM-LP
          </span>
        </div>
      </div>
    </>
  );
}

export default RemoveLiquidity;
