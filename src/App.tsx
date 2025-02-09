import { useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { Program, AnchorProvider, IdlAccounts } from "@coral-xyz/anchor";

import idl from "./idl/idl.json";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SolonaKid } from "./idl/idl.ts";

type InfoData = IdlAccounts<SolonaKid>["counter"];

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MainApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function MainApp() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [data, setData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // สำหรับข้อความสถานะ
  const [logMessages, setLogMessages] = useState<string[]>([]); // เก็บข้อความจาก msg!

  const program = useMemo(() => {
    if (!publicKey || !connected || !wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {});
    return new Program<SolonaKid>(idl as SolonaKid, provider);
  }, [connection, publicKey]);

  // ฟังก์ชันสำหรับเรียก initialize
  const initializeCounter = async () => {
    if (!program || !publicKey) {
      setMessage("Error: Wallet not connected or program not initialized.");
      return;
    }

    try {
      setMessage("Initializing counter...");
      let somedata = await program.methods
        .initialize()
        .accounts({
          user: publicKey, // ใช้ publicKey ของผู้ใช้งาน
        })
        .rpc();
      console.log(somedata)
      setMessage("Transaction completed successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Error during initialization.");
    }
  };

  useEffect(() => {
    if (connection && publicKey) {
      // Explicitly define the type of unsubscribe as a function
      const unsubscribe = connection.onLogs(
        publicKey,
        (logs) => {
          // ตรวจสอบว่ามีข้อความจาก msg! หรือไม่
          const newLogs = logs.logs.filter(log => log.includes("Greetings from"));
          if (newLogs.length > 0) {
            setLogMessages(prevLogs => [...prevLogs, ...newLogs]);
          }
        },
        "confirmed"
      );
  
      // Ensure unsubscribe is a function and properly called in the cleanup function

    }
  }, [connection, publicKey]);

  return (
    <div className="flex flex-col items-center mx-auto my-6 space-y-4">
      <WalletMultiButton />
      <h1 className="text-center">Solana Increment App</h1>
      <button className="btn-primary" onClick={initializeCounter}>
        Increment Counter
      </button>
      {data ? <div>Counter Value: {data}</div> : <div>Loading data...</div>}
      {message && <div className="text-center">{message}</div>} {/* แสดงข้อความ */}
      {logMessages.length > 0 && (
        <div>
          <h2>Program Logs:</h2>
          {logMessages.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
