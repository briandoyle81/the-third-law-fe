import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { useState } from "react";
import GameList from "../components/gameList";
import GameBoard from "../components/gameBoard";
import GameDescription from "../components/gameDescription";
import Leaderboard from "../components/leaderboard";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { baseGoerli } from "wagmi/chains";

const Home: NextPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [gameId, setGameId] = useState<BigInt>(BigInt(0));

  const { ready, authenticated, user, logout, login } = usePrivy();
  // const { wallets } = useWallets(); // TODO: See https://docs.privy.io/guide/guides/wagmi
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>The Third Law - Testnet</h1>
        {activeWallet?.chainId !== "eip155:" + baseGoerli.id.toString() && (
          <div>Please Change to Base Goerli</div>
        )}
        <button onClick={ready && authenticated ? logout : login}>
          {ready && authenticated ? "Logout" : "Login"}
        </button>
      </header>
      <nav>
        <ul className={styles.tabList}>
          {["Games", "Leaderboard", "Current Game", "About"].map(
            (tab, index) => (
              <li
                key={index}
                className={activeTab === index ? styles.active : ""}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </li>
            )
          )}
        </ul>
      </nav>

      <main className={styles.content}>
        {activeTab === 0 && (
          <GameList setGameId={setGameId} setActiveTab={setActiveTab} />
        )}
        {activeTab === 1 && <Leaderboard />}
        {activeTab === 2 && <GameBoard gameId={gameId} setGameId={setGameId} />}
        {activeTab === 3 && <GameDescription />}
      </main>
    </div>
  );
};

export default Home;
