// useEffect(() => {
//   (async function () {
//     try {
//       if ((window as any).solana) {
//         const solana = (window as any).solana;
//         console.log(solana, "solana");
//         const res = await solana.connect({onlyIfTrusted: true});
//         setWalletId(res.publicKey.toString());
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   })();
// }, []);

// const disconnectWallet = async () => {
//   try {
//     if ((window as any).solana) {
//       const solana = (window as any).solana;
//       await solana.disconnect();
//       setWalletId(null);
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };
