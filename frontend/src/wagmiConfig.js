import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const rpcUrl = import.meta.env.VITE_RPC_URL;

// The "Mobile wallet" option only appears when a real WalletConnect Project ID is set.
const connectors = [injected()];
if (projectId) {
  connectors.push(
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'TCH8 Marketplace',
        description: 'Escrow marketplace on Sepolia',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
        icons: [],
      },
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: { [sepolia.id]: http(rpcUrl || undefined) },
});
