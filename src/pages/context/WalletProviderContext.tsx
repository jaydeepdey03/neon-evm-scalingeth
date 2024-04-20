import {Wallet} from "@coral-xyz/anchor";
import {useWallet} from "@solana/wallet-adapter-react";
import {PhantomWalletName} from "@solana/wallet-adapter-wallets";
import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {} from "@neonevm/token-transfer-ethers";
import {
  GasToken,
  NEON_STATUS_DEVNET_SNAPSHOT,
  NeonProgramStatus,
  NeonProxyRpcApi,
} from "@neonevm/token-transfer";

//
interface ConnectWalletContextProps {
  connectWallettoMetamask: () => void;
  connectWalletToPhantom: () => void;
  publicKeySolana: string;
  connected: boolean;
  connecting: boolean;
  disconnect: () => void;
}

export const Web3Context = createContext<ConnectWalletContextProps>({
  connectWallettoMetamask() {},
  connectWalletToPhantom() {},
  publicKeySolana: "",
  connected: false,
  connecting: false,
} as ConnectWalletContextProps);

export default function NeonPayProvider({children}: {children: ReactNode}) {
  const {ethereum} = window;
  const {
    connected,
    connecting,
    disconnect,
    publicKey,
    select,
    wallet,
    sendTransaction,
    signTransaction,
  } = useWallet();

  const [neonWalletAddress, setNeonWalletAddress] = useState<string | null>(
    null
  );

  const [proxyStatus, setProxyStatus] = useState<NeonProgramStatus>(
    NEON_STATUS_DEVNET_SNAPSHOT
  );

  const [neonNativeToken, setNeonNativeToken] = useState<GasToken>();
  const [solNativeToken, setSolNativeToken] = useState<GasToken>();

  useEffect(() => {
    (async function () {
      const [neonNativeToken, solNativeToken] =
        await neonProxyApi.nativeTokenList();
      setNeonNativeToken(neonNativeToken);
      setSolNativeToken(solNativeToken);
    })();
  }, []);

  const neonProgram = useMemo(() => {
    if (proxyStatus) {
      return new PublicKey(proxyStatus?.NEON_EVM_ID!);
    }
    return new PublicKey(NEON_STATUS_DEVNET_SNAPSHOT.NEON_EVM_ID);
  }, [proxyStatus]);

  const getProxyStatus = useCallback(async () => {
    const proxyStatus = await proxyApi.evmParams();
    const gasTokens = await proxyApi.nativeTokenList();
    setProxyStatus(proxyStatus);
    setGasTokens(gasTokens);
  }, [proxyApi]);

  const connectWallettoMetamask = async () => {
    try {
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"}); // request connection with accounts

      console.log("Connected", accounts[0]);
      setNeonWalletAddress(accounts[0]);
      // const chainId = await ethereum.request({ method: 'eth_chainId' });
    } catch (e) {
      console.log(e);
    }
  };

  const connectWalletToPhantom = () => {
    select(PhantomWalletName);
  };

  const neonNeonEvmUrl = `https://devnet.neonevm.org`;
  const solNeonEvmUrl = `https://devnet.neonevm.org/solana/sol`;
  const solanaUrl = `https://api.devnet.solana.com`;

  const neonProxyApi = new NeonProxyRpcApi({
    neonProxyRpcApi: neonNeonEvmUrl,
    solanaRpcApi: solanaUrl,
  });
  const solProxyApi = new NeonProxyRpcApi({
    neonProxyRpcApi: solNeonEvmUrl,
    solanaRpcApi: solanaUrl,
  });

  return (
    <Web3Context.Provider
      value={{
        connectWallettoMetamask,
        connectWalletToPhantom,
        publicKeySolana: publicKey?.toString() || "",
        connected,
        connecting,
        disconnect,
        // export all the variables
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3Hook = () => {
  return useContext(Web3Context);
};
