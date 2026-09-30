import "./AddLiquidity.css";
import { Form } from "radix-ui";
import { useState } from "react";
import { usePublicClient, useWriteContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS } from "../../contracts/addresses";
import AMMPairArtifact from "./../../../../contracts/out/AMMPair.sol/AMMPair.json";

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

type AddLiquidityProps = {
  onLiquidityAdded: () => Promise<void>;
};

function AddLiquidity({ onLiquidityAdded }: AddLiquidityProps) {
  const [depositA, setDepositA] = useState("");
  const [depositB, setDepositB] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const isAddingLiquidity = status !== "";

  async function handleAddLiquidity() {
    setError("");
    setStatus("");

    if (!depositA || !depositB) {
      setError("Enter both deposit amounts.");
      return;
    }

    if (Number(depositA) <= 0 || Number(depositB) <= 0) {
      setError("Deposit amounts must be greater than 0.");
      return;
    }

    if (!publicClient || !address) {
      setError("Wallet not connected.");
      return;
    }

    try {
      const amountA = parseUnits(depositA, 18);
      const amountB = parseUnits(depositB, 18);

      // 1. Approve Token A
      setStatus("Approving MTKA...");

      const approveATx = await writeContractAsync({
        address: CONTRACTS.sepolia.tokenA,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.pair, amountA],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveATx,
      });

      // 2. Approve Token B
      setStatus("Approving MTKB...");

      const approveBTx = await writeContractAsync({
        address: CONTRACTS.sepolia.tokenB,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.pair, amountB],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveBTx,
      });

      // 3. Estimate gas
      setStatus("Estimating gas...");

      const gas = await publicClient.estimateContractGas({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: "addLiquidity",
        args: [amountA, amountB],
        account: address,
      });

      // 4. Add liquidity
      setStatus("Adding liquidity...");

      const addLiquidityTx = await writeContractAsync({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: "addLiquidity",
        args: [amountA, amountB],
        gas,
      });

      // 5. Wait for add liquidity transaction
      setStatus("Confirming transaction...");

      await publicClient.waitForTransactionReceipt({
        hash: addLiquidityTx,
      });

      // 6. Refresh pool state
      await onLiquidityAdded();

      setDepositA("");
      setDepositB("");
      setStatus("");
    } catch (err) {
      console.error(err);

      setStatus("");

      setError(err instanceof Error ? err.message : "Failed to add liquidity.");
    }
  }

  return (
    <div className="add-liquidity-card">
      <Form.Root
        className="liquidity-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleAddLiquidity();
        }}
      >
        <Form.Field className="liquidity-field" name="MTKA">
          <Form.Control asChild>
            <div className="liquidity-input-wrapper">
              <input
                className="liquidity-input"
                type="number"
                placeholder="0.0"
                min="0"
                step="any"
                value={depositA}
                onChange={(event) => setDepositA(event.target.value)}
                disabled={isAddingLiquidity}
              />

              <div className="token-symbol">MTKA</div>
            </div>
          </Form.Control>
        </Form.Field>

        <Form.Field className="liquidity-field" name="MTKB">
          <Form.Control asChild>
            <div className="liquidity-input-wrapper">
              <input
                className="liquidity-input"
                type="number"
                placeholder="0.0"
                min="0"
                step="any"
                value={depositB}
                onChange={(event) => setDepositB(event.target.value)}
                disabled={isAddingLiquidity}
              />

              <div className="token-symbol">MTKB</div>
            </div>
          </Form.Control>
        </Form.Field>

        {error && <div className="liquidity-error">{error}</div>}

        <Form.Submit asChild>
          <button
            className="add-liquidity-button"
            type="submit"
            disabled={isAddingLiquidity}
          >
            {isAddingLiquidity ? status : "Add Liquidity"}
          </button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}

export default AddLiquidity;
