import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { useState } from "react";
import GameList from "../components/gameList";
import GameBoard from "../components/gameBoard";

const Home: NextPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [gameId, setGameId] = useState<BigInt>(BigInt(0));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>The Third Law</h1>
        <ConnectButton />
      </header>

      <nav>
        <ul className={styles.tabList}>
          {["Games", "???", "Current Game", "About"].map((tab, index) => (
            <li
              key={index}
              className={activeTab === index ? styles.active : ""}
              onClick={() => setActiveTab(index)}
            >
              {tab}
            </li>
          ))}
        </ul>
      </nav>

      <main className={styles.content}>
        {activeTab === 0 && (
          <GameList setGameId={setGameId} setActiveTab={setActiveTab} />
        )}
        {activeTab === 1 && <div>Content for Tab 2</div>}
        {activeTab === 2 && <GameBoard gameId={gameId} setGameId={setGameId} />}
        {activeTab === 3 && <div>TODO</div>}
      </main>
    </div>
  );
};

export default Home;
