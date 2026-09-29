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

function AddLiquidity() {
  const [depositA, setDepositA] = useState("");
  const [depositB, setDepositB] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [error, setError] = useState("");

  const { writeContractAsync } = useWriteContract();

  const publicClient = usePublicClient();
  const { address } = useAccount();

  async function handleAddLiquidity() {
    setError("");

    if (!depositA || !depositB) {
      setError("Enter both deposit amounts.");
      return;
    }

    if (Number(depositA) <= 0 || Number(depositB) <= 0) {
      setError("Deposit amounts must be greater than 0.");
      return;
    }

    try {
      setIsAddingLiquidity(true);
      const amountA = parseUnits(depositA, 18);
      const amountB = parseUnits(depositB, 18); // 1. Approve Token A
      await writeContractAsync({
        address: CONTRACTS.sepolia.tokenA,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.pair, amountA],
      });
      // 2. Approve Token B
      await writeContractAsync({
        address: CONTRACTS.sepolia.tokenB,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.sepolia.pair, amountB],
      });

      const gas = await publicClient!.estimateContractGas({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: "addLiquidity",
        args: [amountA, amountB],
        account: address,
      });
      // 3. Add liquidity
      await writeContractAsync({
        address: CONTRACTS.sepolia.pair,
        abi: AMMPairArtifact.abi,
        functionName: "addLiquidity",
        args: [amountA, amountB],
        gas: gas,
      });
      setDepositA("");
      setDepositB("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add liquidity.");
    } finally {
      setIsAddingLiquidity(false);
    }
  }

  return (
    <div className="add-liquidity-card">
      <h2 className="add-liquidity-title">Add Liquidity</h2>
      <Form.Root
        className="liquidity-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleAddLiquidity();
        }}
      >
        <Form.Field className="liquidity-field" name="MTKA">
          <Form.Label className="liquidity-label">MTKA</Form.Label>

          <Form.Control asChild>
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
          </Form.Control>
        </Form.Field>

        <Form.Field className="liquidity-field" name="MTKB">
          <Form.Label className="liquidity-label">MTKB</Form.Label>

          <Form.Control asChild>
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
          </Form.Control>
        </Form.Field>

        {error && <div className="liquidity-error"> {error} </div>}

        <Form.Submit asChild>
          <button
            className="add-liquidity-button"
            type="submit"
            disabled={isAddingLiquidity}
          >
            {isAddingLiquidity ? "Adding Liquidity..." : "Add Liquidity"}
          </button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}

export default AddLiquidity;
