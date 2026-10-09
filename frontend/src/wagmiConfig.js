import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/alch_W9PaT3IY_E4Nb_UarWaZ_'),
  },
});