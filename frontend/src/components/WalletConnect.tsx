import "./WalletConnect.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const getButtonText = (): string => {
          if (!account || !chain) {
            return "Connect Wallet";
          }

          if (chain.unsupported) {
            return "Wrong network";
          }

          return account.displayName;
        };

        const handleClick = (): void => {
          if (!account || !chain) {
            openConnectModal();
            return;
          }

          if (chain.unsupported) {
            openChainModal();
            return;
          }

          openAccountModal();
        };

        if (!mounted) {
          return null;
        }

        return (
          <button
            className="wallet-connect"
            onClick={handleClick}
            type="button"
          >
            {getButtonText()}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default WalletConnect;
