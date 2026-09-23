import "./PoolState.css";
import { Separator } from "radix-ui";

type PoolStats = {
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  userLpBalance: string;
};

type PoolStateProps = {
  poolStats: PoolStats;
};

function PoolState({ poolStats }: PoolStateProps) {
  return (
    <div className="pool-stats">
      <div className="pool-stat">
        <span className="pool-stat-label">Reserve MTKA</span>
        <span className="pool-stat-value pool-stat-value-a">
          {poolStats.reserve0}
        </span>
      </div>

      <Separator.Root className="pool-stat-separator" orientation="vertical" />

      <div className="pool-stat">
        <span className="pool-stat-label">Reserve MTKB</span>
        <span className="pool-stat-value pool-stat-value-b">
          {poolStats.reserve1}
        </span>
      </div>

      <Separator.Root className="pool-stat-separator" orientation="vertical" />

      <div className="pool-stat">
        <span className="pool-stat-label">LP supply</span>
        <span className="pool-stat-value">{poolStats.totalSupply}</span>
      </div>

      <Separator.Root className="pool-stat-separator" orientation="vertical" />

      <div className="pool-stat">
        <span className="pool-stat-label">Your LP share</span>
        <span className="pool-stat-value">{poolStats.userLpBalance}</span>
      </div>
    </div>
  );
}

export default PoolState;
