import {
  NEON_TOKEN_MODEL,
  NEON_TRANSFER_CONTRACT_DEVNET,
  networkUrls,
  SOL_TOKEN_MODEL,
} from "@/lib/constants";
import {CHAIN_ID, token_list} from "@/lib/token-list";
import {Wallet} from "@coral-xyz/anchor";
import {
  Amount,
  GasToken,
  NEON_STATUS_DEVNET_SNAPSHOT,
  NEON_TOKEN_MINT_DEVNET,
  neonNeonTransactionWeb3,
  NeonProgramStatus,
  NeonProxyRpcApi,
  neonTransferMintWeb3Transaction,
  SPLToken,
} from "@neonevm/token-transfer";
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
import {Big} from "big.js";
import {
  delay,
  mintTokenBalance,
  neonBalance,
  solanaBalance,
  splTokenBalance,
} from "@/lib/utils";
import {getAssociatedTokenAddressSync} from "@solana/spl-token";
import Web3 from "web3";

//
interface ConnectWalletContextProps {
  connectWallet: () => void;
  publicKeyAsString: String;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnect: () => void;
  disconnecting: boolean;
  walletObj: Wallet | null;
  token: string;
  splToken: SPLToken | null;
  handleSubmit: (amount: Amount) => void;
  connectWallettoMetamask: () => void;
}

export const Web3Context = createContext<ConnectWalletContextProps>({
  web3: new Web3(),
  connectWallet: () => {},
  publicKeyAsString: "",
  publicKey: null,
  connected: false,
  connecting: false,
  disconnect: () => {},
  disconnecting: false,
  walletObj: null,
  token: "",
  splToken: null,
  handleSubmit: () => {},
  connectWallettoMetamask: () => {},
} as ConnectWalletContextProps);

interface TransferDirection {
  direction: "solana" | "neon";
  from: string;
  to: string;
}

interface TransferSignature {
  neon?: string;
  solana?: string;
}

export interface TokenBalance {
  neon: Big;
  solana: Big;
}

export default function NeonPayProvider({children}: {children: ReactNode}) {
  const {ethereum} = window;
  const {
    connected,
    connecting,
    disconnect,
    publicKey,
    disconnecting,
    select,
    wallet,
    sendTransaction,
    signTransaction,
  } = useWallet();

  const TOKEN_LIST: SPLToken[] = token_list.tokens.filter(
    (token) => token.chainId === CHAIN_ID
  ) as SPLToken[];

  //   all the states
  const [proxyStatus, setProxyStatus] = useState<NeonProgramStatus>(
    NEON_STATUS_DEVNET_SNAPSHOT
  );
  const [token, setToken] = useState<string>("wSOL"); // which token to send as a part of form
  const [neonWallet, setNeonWallet] = useState(""); // metamask wallet address
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    neon: new Big(0),
    solana: new Big(0),
  });

  const [walletBalance, setWalletBalance] = useState<TokenBalance>({
    neon: new Big(0),
    solana: new Big(0),
  });
  const [transfer, setTransfer] = useState<TransferDirection>({
    direction: "solana",
    from: publicKey?.toBase58() || "",
    to: neonWallet,
  });
  const [chainId, setChainId] = useState(CHAIN_ID);
  const [signature, setSignature] = useState<Partial<TransferSignature>>({
    solana: "",
    neon: "",
  });
  const [gasTokens, setGasTokens] = useState<GasToken[]>([]);
  //   const [amount, setAmount] = useState<string>('0.1');

  // get all the network urls
  const networkUrl = useMemo(() => {
    const id = networkUrls.findIndex((i) => i.id === chainId);
    return id > -1 ? networkUrls[id] : networkUrls[0];
  }, [chainId]);

  // connect to solana
  const connection = useMemo(() => {
    return new Connection(networkUrl.solana, "confirmed");
  }, [networkUrl]);

  console.log(networkUrl.neonProxy, "proxy");

  // connect to neon evm proxy node
  const web3: Web3 = useMemo(() => {
    const url = new Web3.providers.HttpProvider(networkUrl.neonProxy);
    return new Web3(url);
  }, [networkUrl]);

  const proxyApi = useMemo(() => {
    return new NeonProxyRpcApi({
      neonProxyRpcApi: networkUrl.neonProxy,
      solanaRpcApi: networkUrl.solana,
    });
  }, [networkUrl]);

  const connectWallet = async () => {
    select(PhantomWalletName);
  };

  //  all the memoized values
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

  const networkTokenMint = useMemo(() => {
    const id = gasTokens.findIndex(
      (i) => parseInt(i.token_chain_id, 16) === chainId
    );
    if (id > -1) {
      return new PublicKey(gasTokens[id].token_mint);
    }
    return new PublicKey(NEON_TOKEN_MINT_DEVNET);
  }, [gasTokens, chainId]);

  const tokenList = useMemo<SPLToken[]>(() => {
    const supported = ["wSOL", "USDT", "USDC"];
    const tokens = TOKEN_LIST.filter((i: any) => supported.includes(i.symbol));
    if (chainId === networkUrls[0].id) {
      tokens.unshift({
        ...NEON_TOKEN_MODEL,
        address_spl: networkTokenMint.toBase58(),
      });
    } else {
      const wSOL = tokens.find((i: any) => i.symbol === "wSOL");
      tokens.unshift({
        ...wSOL,
        ...SOL_TOKEN_MODEL,
        address_spl: networkTokenMint.toBase58(),
      });
    }
    return tokens;
  }, [chainId, networkTokenMint]);

  const splToken = useMemo(() => {
    const index = tokenList.findIndex((i) => i.symbol === token);
    if (index > -1) {
      return tokenList[index];
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getTokenBalance = useCallback(async () => {
    if (splToken && publicKey && neonWallet) {
      switch (splToken.symbol) {
        case "NEON": {
          const solana = await splTokenBalance(
            connection,
            publicKey!,
            splToken
          );
          const neon = await neonBalance(web3, neonWallet);
          setTokenBalance({
            solana: new Big(solana.amount).div(Math.pow(10, solana.decimals)),
            neon,
          });
          break;
        }
        case "SOL": {
          const solana = await solanaBalance(connection, publicKey!);
          const neon = await neonBalance(web3, neonWallet);
          setTokenBalance({solana, neon});
          break;
        }
        case "wSOL": {
          const address = new PublicKey(splToken.address_spl);
          const associatedToken = getAssociatedTokenAddressSync(
            address,
            publicKey!
          );
          const solana = await solanaBalance(connection, associatedToken);
          const neon = await mintTokenBalance(web3, neonWallet, splToken);
          setTokenBalance({solana, neon});
          break;
        }
        default: {
          const solana = await splTokenBalance(
            connection,
            publicKey!,
            splToken
          );
          const neon = await mintTokenBalance(web3, neonWallet, splToken);
          setTokenBalance({
            solana: new Big(solana.amount).div(Math.pow(10, solana.decimals)),
            neon,
          });

          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3, splToken]);

  const getWalletBalance = useCallback(async () => {
    const solana = await solanaBalance(connection, publicKey!);
    const neon = await neonBalance(web3, neonWallet);
    setWalletBalance({solana, neon});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3]);

  const handleSubmit = async (amount: Amount) => {
    if (token && splToken && signTransaction) {
      const mintPubkey = new PublicKey(splToken.address_spl);
      const associatedToken = getAssociatedTokenAddressSync(
        mintPubkey,
        publicKey!
      );

      console.log(connection, "connection");

      const transaction: Transaction = await neonTransferMintWeb3Transaction(
        connection,
        web3,
        proxyApi,
        proxyStatus,
        neonProgram,
        publicKey!,
        neonWallet,
        splToken,
        amount,
        chainId
      );
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      // const solana = await sendTransaction(connection, transaction, [solanaSigner], true, { skipPreflight: false });

      const signature = await signTransaction(transaction);

      // setSignature({ signature });
      await delay(1e3);
      await getTokenBalance();
      await getWalletBalance();
      await delay(5e3);
    }
  };

  // if (splToken && publicKey) {
  //   console.log(splToken, "yeah", publicKey, "hello");
  //   const tokenaddress = getAssociatedTokenAddressSync(
  //     new PublicKey(splToken!.address_spl),
  //     publicKey!
  //   );
  // }

  const connectWallettoMetamask = async () => {
    try {
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"}); // request connection with accounts

      console.log("Connected", accounts[0]);
      setNeonWallet(accounts[0]);
      // const chainId = await ethereum.request({ method: 'eth_chainId' });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        connectWallettoMetamask,
        connectWallet,
        publicKey,
        publicKeyAsString: publicKey?.toString() || "",
        connected,
        connecting,
        disconnect,
        disconnecting,
        walletObj: wallet as Wallet | null,
        // export all the variables

        token,
        splToken,

        handleSubmit,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3Hook = () => {
  return useContext(Web3Context);
};
