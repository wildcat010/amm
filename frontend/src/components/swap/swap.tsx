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

import RouterArtifact from "./../../contracts/Router.json";
import PairArtifact from "./../../contracts/AMMPair.json";

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
    abi: PairArtifact.abi,
    functionName: "reserve0",
  });

  const { data: reserve1Data, refetch: refetchReserve1 } = useReadContract({
    address: CONTRACTS.sepolia.pair,
    abi: PairArtifact.abi,
    functionName: "reserve1",
  });

  // Read the quote from the Pair contract.
  const { data: amountOutData } = useReadContract({
    address: CONTRACTS.sepolia.pair,
    abi: PairArtifact.abi,
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
        setDebouncedPay("");
        return;
      }

      setError("");
      setDebouncedPay(pay);
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
      setIsSwapping(false);
      setError(
        `Insufficient liquidity. Maximum ${availableReserve} ${
          swap ? "MTKB" : "MTKA"
        }.`,
      );
      return;
    }

    setError("");

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

      const outputToken = swap
        ? CONTRACTS.sepolia.tokenA
        : CONTRACTS.sepolia.tokenB;

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

      setStatus(`Approving ${swap ? "MTKB" : "MTKA"}...`);

      const approveTx = await writeContractAsync({
        address: inputToken,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.router.router, amountIn],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveTx,
      });

      setStatus(`Swapping ${swap ? "MTKB" : "MTKA"}...`);

      // Execute the swap through the Router, not directly through the Pair.
      const swapTx = await writeContractAsync({
        address: CONTRACTS.sepolia.router.router,
        abi: RouterArtifact.abi,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, 0n, inputToken, outputToken, address, deadline],
      });

      setStatus("Confirming transaction...");

      await publicClient.waitForTransactionReceipt({
        hash: swapTx,
      });

      await onSwapRefresh();

      await Promise.all([refetchReserve0(), refetchReserve1()]);

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
            <button className="swap-button" type="submit" disabled={isSwapping}>
              {status ? status : "Swap"}
            </button>
          </Form.Submit>
        </Form.Root>
      </div>
    </>
  );
}

export default Swap;
