import { erc20Abi, NEON_TOKEN_MINT_DECIMALS, SPLToken } from "@neonevm/token-transfer";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey, TokenAmount } from "@solana/web3.js";
import Big from "big.js";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Account, TransactionConfig } from 'web3-core';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export async function sendSignedTransaction(web3: Web3, transaction: TransactionConfig, account: Account): Promise<string> {
  const signedTrx = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
  return new Promise((resolve, reject) => {
    if (signedTrx?.rawTransaction) {
      web3.eth.sendSignedTransaction(signedTrx.rawTransaction)
        .on('receipt', (receipt) => {
          resolve(receipt.transactionHash);
        })
        .on('error', (error) => {
          reject(error);
        });
    } else {
      reject('Unknown transaction');
    }
  });
}


export async function neonBalance(web3: Web3, address: string): Promise<Big> {
  const balance = await web3.eth.getBalance(address);
  return new Big(balance.toString()).div(Big(10).pow(NEON_TOKEN_MINT_DECIMALS));
}

export async function solanaBalance(connection: Connection, address: PublicKey): Promise<Big> {
  const balance = await connection.getBalance(address);
  return new Big(balance).div(LAMPORTS_PER_SOL);
}

export async function splTokenBalance(connection: Connection, walletPubkey: PublicKey, token: SPLToken): Promise<TokenAmount> {
  const mintAccount = new PublicKey(token.address_spl);
  const assocTokenAccountAddress = await getAssociatedTokenAddress(mintAccount, walletPubkey);
  const response = await connection.getTokenAccountBalance(assocTokenAccountAddress);
  return response?.value;
}

export async function mintTokenBalance(web3: Web3, account: string, token: SPLToken, contractAbi: AbiItem[] = erc20Abi): Promise<Big> {
  const tokenInstance = new web3.eth.Contract(contractAbi, token.address);
  const balance = await tokenInstance.methods.balanceOf(account).call() as string;
  return new Big(balance).div(Math.pow(10, token.decimals));
}

export function solanaSignature(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function neonSignature(signature: string): string {
  return `https://devnet.neonscan.org/tx/${signature}`;
}

export function stringShort(data: string, len = 30): string {
  const half = Math.round(len / 2);
  return `${data.slice(0, half)}..${data.slice(-half)}`;
}



export async function delay(timestamp: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timestamp);
  });
}

