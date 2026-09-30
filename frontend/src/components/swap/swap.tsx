import "./swap.css";
import { Form } from "radix-ui";
import { useEffect, useState } from "react";
import { CONTRACTS } from "../../contracts/addresses";
import { formatUnits, parseUnits } from "viem";

import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import AMMPairArtifact from "./../../../../contracts/out/AMMPair.sol/AMMPair.json";

type SwapProps = {
  onSwapRefresh: () => Promise<void>;
};

type PoolStats = {
  reserve0: string;
  reserve1: string;
  rate: string;
};

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function Swap({ onSwapRefresh }: SwapProps) {
  const [pay, setPay] = useState("");
  const [debouncedPay, setDebouncedPay] = useState("");
  const [receive, setReceive] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const [swap, setSwap] = useState<boolean>(false);

  const [poolStats, setPoolStats] = useState<PoolStats>({
    reserve0: "0",
    reserve1: "0",
    rate: "0",
  });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();

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

  const { data: amountOutData } = useReadContract({
    address: CONTRACTS.sepolia.pair,
    abi: AMMPairArtifact.abi,
    functionName: "getAmountOut",
    args: [parseUnits(debouncedPay || "0", 18), !swap],
    query: {
      enabled: Number(debouncedPay) > 0,
    },
  });

  useEffect(() => {
    if (
      typeof reserve0Data !== "bigint" ||
      typeof reserve1Data !== "bigint" ||
      reserve0Data === 0n ||
      reserve1Data === 0n
    ) {
      setPoolStats({ reserve0: "0", reserve1: "0", rate: "0" });
      return;
    }
    const reserve0 = Number(formatUnits(reserve0Data, 18));
    const reserve1 = Number(formatUnits(reserve1Data, 18));
    const rate = swap ? reserve0 / reserve1 : reserve1 / reserve0;
    setPoolStats({
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      rate: rate.toString(),
    });
  }, [reserve0Data, reserve1Data, swap, pay, amountOutData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pay === "") {
        setReceive("");
        return;
      } else {
        setError("");
        setDebouncedPay(pay);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [pay]);

  useEffect(() => {
    const payAmount = Number(pay);
    const availableReserve = swap
      ? Number(poolStats.reserve1)
      : Number(poolStats.reserve0);

    if (payAmount > availableReserve) {
      setReceive("");
      setIsSwapping(true);
      setError(
        `Insufficient liquidity. Maximum ${availableReserve} ${
          swap ? "MTKB" : "MTKA"
        }.`,
      );
      return;
    }

    setError("");
    setIsSwapping(false);
    if (typeof amountOutData === "bigint") {
      setReceive(formatUnits(amountOutData, 18));
    } else {
      setReceive("");
    }
  }, [amountOutData]);

  async function handleSwitch() {
    setSwap(!swap);
    setPay("");
    setReceive("");
    setDebouncedPay("");
    setError("");

    await Promise.all([refetchReserve0(), refetchReserve1()]);
  }

  async function handleSwap() {
    setError("");
    setStatus("");

    // MODIFIED: Validate wallet connection before sending transactions.
    if (!address) {
      setError("Wallet not connected.");
      return;
    }

    if (!publicClient) {
      setError("Wallet client is not available.");
      return;
    }

    if (!pay || Number(pay) <= 0) {
      setError("Enter an amount to swap.");
      return;
    }
    try {
      setIsSwapping(true);
      const amountIn = parseUnits(pay, 18);

      const inputToken = swap
        ? CONTRACTS.sepolia.tokenB
        : CONTRACTS.sepolia.tokenA;

      const swapFunction = swap ? "swapToken1ForToken0" : "swapToken0ForToken1";

      setStatus(`Approving ${swap ? "MTKB" : "MTKA"}...`);

      const approveTx = await writeContractAsync({
        address: inputToken,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.pair, amountIn],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveTx,
      });

      setStatus(`Swapping ${swap ? "MTKB" : "MTKA"}...`);

      const swapTx = await writeContractAsync({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: swapFunction,
        args: [amountIn, 0n],
      });

      // Wait for the swap transaction
      setStatus("Confirming transaction...");

      await publicClient.waitForTransactionReceipt({
        hash: swapTx,
      });

      // Refresh pool state
      await onSwapRefresh();

      await Promise.all([refetchReserve0(), refetchReserve1()]);

      // Reset form
      setPay("");
      setDebouncedPay("");
      setReceive("");
      setStatus("");
      setIsSwapping(false);
    } catch (err) {
      console.error(err);

      setStatus("");
      setIsSwapping(false);

      setError(err instanceof Error ? err.message : "Swap failed.");
    }
  }

  return (
    <>
      <div className="swap-card">
        <Form.Root
          className="swap-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSwap();
          }}
        >
          <div className="swap-label">You pay</div>
          <Form.Field className="swap-field" name="swapFrom">
            <Form.Control asChild>
              <div className="swap-input-wrapper">
                <input
                  className="swap-input"
                  type="number"
                  placeholder="0.0"
                  min="0"
                  step="any"
                  value={pay}
                  onChange={(event) => setPay(event.target.value)}
                />

                <div className="token-symbol">{!swap ? "MTKA" : "MTKB"}</div>
              </div>
            </Form.Control>
          </Form.Field>

          <button
            type="button"
            onClick={handleSwitch}
            className="swap-switch-button"
          >
            <span> ⇅ </span>
          </button>

          <div className="swap-label">You receive (estimated)</div>
          <Form.Field className="swap-field" name="swapTo">
            <Form.Control asChild>
              <div className="swap-input-wrapper">
                <input
                  className="swap-input"
                  type="number"
                  placeholder="0.0"
                  min="0"
                  step="any"
                  value={receive}
                  onChange={(event) => setReceive(event.target.value)}
                />

                <div className="token-symbol">{!swap ? "MTKB" : "MTKA"}</div>
              </div>
            </Form.Control>
          </Form.Field>
          <div className="swap-rate">
            <span className="swap-label">Rate</span>
            <div>
              <span>
                1 {!swap ? "MTKA" : "MTKB"} ≈{" "}
                {Number(poolStats.rate).toFixed(4)} {!swap ? "MTKB" : "MTKA"}
              </span>
            </div>
          </div>
          {error && <div className="swap-error">{error}</div>}
          <Form.Submit asChild>
            <button
              className="swap-button"
              type="submit"
              disabled={isSwapping}
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              {status ? status : "Swap"}
            </button>
          </Form.Submit>
        </Form.Root>
      </div>
    </>
  );
}

export default Swap;
