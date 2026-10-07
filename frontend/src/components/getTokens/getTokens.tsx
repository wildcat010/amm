import "./getTokens.css";
import { useState } from "react";
import { isAddress } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import { CONTRACTS } from "../../contracts/addresses";
import MyTokenAArtifact from "./../../../../contracts/out/MyTokenA.sol/MyTokenA.json";
import MyTokenBArtifact from "./../../../../contracts/out/MyTokenB.sol/MyTokenB.json";

function GetTokens() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadingToken, setLoadingToken] = useState<"mtka" | "mtkb" | "">("");

  const handleGetToken = async (token: "mtka" | "mtkb") => {
    try {
      setError("");

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      if (!publicClient) {
        throw new Error("Public client not available");
      }

      if (!recipient) {
        throw new Error("Please enter a recipient address");
      }

      if (!isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      setLoadingToken(token);
      setStatus("Confirming transaction...");

      const tokenAddress =
        token === "mtka" ? CONTRACTS.sepolia.tokenA : CONTRACTS.sepolia.tokenB;

      const tokenAbi =
        token === "mtka" ? MyTokenAArtifact.abi : MyTokenBArtifact.abi;

      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "faucet",
        args: [recipient as `0x${string}`],
      });

      setStatus("Waiting for transaction...");

      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      setStatus("");
      setLoadingToken("");
      setRecipient("");
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to get tokens");

      setStatus("");
      setLoadingToken("");
    }
  };

  return (
    <div className="get-tokens">
      <div className="get-tokens-header">
        <span>Recipient</span>
      </div>

      <input
        className="get-tokens-input"
        type="text"
        placeholder="0x..."
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        disabled={loadingToken !== ""}
      />

      {error && <div className="get-tokens-error">{error}</div>}

      <div className="get-tokens-buttons">
        <button
          className="get-tokens-button"
          disabled={loadingToken !== ""}
          onClick={() => handleGetToken("mtka")}
        >
          {loadingToken === "mtka" ? status : "Get 1 MTKA"}
        </button>

        <button
          className="get-tokens-button"
          disabled={loadingToken !== ""}
          onClick={() => handleGetToken("mtkb")}
        >
          {loadingToken === "mtkb" ? status : "Get 1 MTKB"}
        </button>
      </div>
    </div>
  );
}

export default GetTokens;
