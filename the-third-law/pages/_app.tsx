import "../styles/globals.css";

import type { AppProps } from "next/app";
import { configureChains } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { PrivyProvider } from "@privy-io/react-auth";
import { PrivyWagmiConnector } from "@privy-io/wagmi-connector";
import { SmartAccountProvider } from "../hooks/SmartAccountContext";

const configureChainsConfig = configureChains(
  [baseSepolia],
  [
    alchemyProvider({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY as string,
    }),
    publicProvider(),
  ]
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        loginMethods: ["email", "google", "twitter", "github"], // TODO: Base paymaster example does not have wallet
        embeddedWallets: {
          createOnLogin: "all-users",
          noPromptOnSignature: true, // TODO: I can probably use this to set whether or not the user pays or paymaster pays
        },
      }}
    >
      <PrivyWagmiConnector wagmiChainsConfig={configureChainsConfig}>
        <SmartAccountProvider>
          <Component {...pageProps} />
        </SmartAccountProvider>
      </PrivyWagmiConnector>
    </PrivyProvider>
  );
}

export default MyApp;
