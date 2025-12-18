import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 1. Import wagmi and dependencies
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, baseSepolia, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask } from "wagmi/connectors";

// Custom chain: Cronos zkEVM Testnet
const cronosZkEvmTestnet = {
  id: 240,
  name: "Cronos zkEVM Testnet",
  nativeCurrency: {
    name: "zkCRO",
    symbol: "zkCRO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet.zkevm.cronos.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos zkEVM Explorer", url: "https://explorer.zkevm.cronos.org/testnet" },
  },
  testnet: true,
};

// 2. Create wagmi config with multi-chain support
const config = createConfig({
  chains: [cronosZkEvmTestnet, baseSepolia, polygonAmoy, sepolia, mainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Nexus DeFi Autopilot",
        url: window.location.host,
      },
    }),
  ],
  transports: {
    [cronosZkEvmTestnet.id]: http("https://testnet.zkevm.cronos.org"),
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

// 3. Create a QueryClient
const queryClient = new QueryClient();

// 4. Wrap your App with the providers
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

