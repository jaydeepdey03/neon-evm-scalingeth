import "@/styles/globals.css";
import type {AppProps} from "next/app";
import NeonPayProvider from "./context/WalletProviderContext";
// import Provider from "../utils/Provider";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {clusterApiUrl} from "@solana/web3.js";
import {useEffect, useMemo, useState} from "react";

export default function App({Component, pageProps}: AppProps) {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <NeonPayProvider>
          <Component {...pageProps} />
        </NeonPayProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
