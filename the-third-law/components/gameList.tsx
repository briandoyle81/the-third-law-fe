import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useContractRead, useContractWrite } from "wagmi";
import TheThirdLaw from "../deployments/TheThirdLaw.json";
import { useIsMounted } from "../utils/useIsMounted";
import { encodeFunctionData, parseEther } from "viem";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { usePrivy } from "@privy-io/react-auth";
import { baseGoerli } from "wagmi/chains";

import { useSmartAccount } from "../hooks/SmartAccountContext";

export const debug_game_cost = parseEther("0.001");

export enum Status {
  NotStarted = 0,
  Player1Destroyed,
  Player2Destroyed,
  Player1Fled,
  Player2Fled,
  Draw,
  Active,
  Over,
}

export type Player = {
  ownerAddress: string;
  gameIds: bigint[];
  inviteIds: bigint[];
  victories: bigint; // Enemy was destroyed
  defaultVictories: bigint; // Enemy was forced to flee
  defaultLosses: bigint; // Player was forced to flee
  draws: bigint; // Both players ran out of weapons
  losses: bigint; // Player was destroyed
  eloRating: bigint;
  currentShipId: bigint;
};

export type Vector2 = {
  row: bigint;
  col: bigint;
};

export type Torpedo = {
  position: Vector2;
  velocity: Vector2;
  remainingFuel: bigint;
};

export type Mine = {
  position: Vector2;
  color?: string;
};

export type Ship = {
  ownerAddress: string;
  position: Vector2;
  velocity: Vector2;
  remainingTorpedoes: bigint;
  remainingMines: bigint;
  torpedoes: Torpedo[];
  mines: Mine[];
};

export type Game = {
  id: bigint;
  player1Address: string;
  player2Address: string;
  player1Ship: Ship;
  player2Ship: Ship;
  status: Status;
  value: bigint; // Amount to be paid to victor, or split if there is a tie
  currentPlayer: string; // Set to None if game not started or is over
  lastTurnTimestamp: bigint;
  round: bigint;
  logBlocks: bigint[];
  free: boolean;
};

interface GameListProps {
  setGameId: Function;
  setActiveTab: Function;
}

const GameList: React.FC<GameListProps> = ({ setGameId, setActiveTab }) => {
  const isMounted = useIsMounted();
  const [games, setGames] = useState<Game[]>([]);
  const [player, setPlayer] = useState<Player>();
  const [address, setAddress] = useState("");

  const [pageIsFocused, setPageIsFocused] = useState(false);

  useEffect(() => {
    const onFocus = () => setPageIsFocused(true);
    const onBlur = () => setPageIsFocused(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const { ready, authenticated } = usePrivy();
  // const { wallets } = useWallets(); // TODO: See https://docs.privy.io/guide/guides/wagmi
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();

  const {
    smartAccountAddress,
    smartAccountProvider,
    sendSponsoredUserOperation,
    eoa,
  } = useSmartAccount();

  useEffect(() => {
    async function switchChain() {
      if (activeWallet) {
        try {
          await activeWallet.switchChain(baseGoerli.id);
        } catch (error) {
          console.error("Error switching chain:", error);
        }
      }
    }

    switchChain();
  }, [activeWallet]);

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    invite({ args: [address], value: debug_game_cost });
    setAddress(""); // Reset the input field after submission
  };

  const handleFreeInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!smartAccountProvider || !smartAccountAddress) {
      console.error("Smart account not ready");
      return;
    }

    if (!activeWallet) {
      console.error("Active wallet not ready");
      return;
    }

    console.log("Free submit");
    try {
      const userOpHash = await sendSponsoredUserOperation({
        // from: activeWallet.address as `0x${string}`, // This doesn't change player 1, it's still the sca address, which is msg.sender
        from: smartAccountAddress,
        to: TheThirdLaw.address as `0x${string}`,
        data: encodeFunctionData({
          abi: TheThirdLaw.abi,
          functionName: "inviteToFreeGame",
          args: [address],
        }),
      });

      const transactionHash = await smartAccountProvider
        .waitForUserOperationTransaction(userOpHash)
        .then((receipt) => {
          console.log("receipt", receipt);
          return receipt;
        });
    } catch (error) {
      console.error("Error inviting to free game:", error);
    }

    setAddress(""); // Reset the input field after submission
  };

  function handleAcceptButtonClick(gameId: BigInt) {
    acceptInvite({ args: [gameId], value: debug_game_cost });
  }

  function handleRejectButtonClick(gameId: BigInt) {
    rejectInvite({ args: [gameId] });
  }

  async function handleAcceptForFreeButtonClick(gameId: BigInt) {
    if (!smartAccountProvider || !smartAccountAddress) {
      console.error("Smart account not ready");
      return;
    }

    if (!activeWallet) {
      console.error("Active wallet not ready");
      return;
    }

    try {
      // I think this is failing in my contract because I'm relying on msg.sender
      // for things and the wallet address is no longer msg.sender
      const userOpHash = await sendSponsoredUserOperation({
        from: smartAccountAddress,
        to: TheThirdLaw.address as `0x${string}`,
        data: encodeFunctionData({
          abi: TheThirdLaw.abi,
          functionName: "acceptFreeInvite",
          args: [gameId],
        }),
      });

      // THIS WORKS!!!
      // console.log("Clicked button");
      // console.log("smartAccountAddress", smartAccountAddress);
      // console.log("activeWallet.address", activeWallet.address);
      // console.log(activeWallet);
      // const userOpHash = await sendSponsoredUserOperation({
      //   from: smartAccountAddress,
      //   to: NFT_ADDRESS,
      //   data: encodeFunctionData({
      //     abi: ABI,
      //     functionName: "mint",
      //     args: ["0xc0a07bd17C5e554759fE2c8A53dd7768A87C24D0"],
      //   }),
      // });

      const transactionHash = await smartAccountProvider
        .waitForUserOperationTransaction(userOpHash)
        .then((receipt) => {
          console.log("receipt", receipt);
          return receipt;
        });
    } catch (error) {
      console.error("Error accepting invite for free:", error);
    }
  }

  function handleGoToGame(gameId: BigInt) {
    setGameId(gameId);
    setActiveTab(2);
  }

  const {
    data: acceptInviteData,
    isError: isAcceptInviteError,
    isLoading: isAcceptInviteLoading,
    isSuccess: isAcceptInviteSuccess,
    write: acceptInvite,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "acceptInvite",
  });

  const {
    data: rejectInviteData,
    isError: isRejectInviteError,
    isLoading: isRejectInviteLoading,
    isSuccess: isRejectInviteSuccess,
    write: rejectInvite,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "rejectInvite",
  });

  const {
    data: createOrJoinRandomGameData,
    isError: isCreateOrJoinRandomGameError,
    isLoading: isCreateOrJoinRandomGameLoading,
    isSuccess: isCreateOrJoinRandomGameSuccess,
    write: createOrJoinRandomGame,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "createOrJoinRandomGame",
  });

  const {
    data: gamesData,
    isError: isGamesDataError,
    isLoading: isGamesDataLoading,
    isSuccess: isGamesDataSuccess,
  } = useContractRead({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "getGamesForPlayer",
    args: [smartAccountAddress],
    watch: true,
    onSettled(data, error) {
      if (data) {
        setGames((data as Game[]).slice().reverse());
      }
    },
  });

  const {
    data: playerData,
    isError: isPlayerDataError,
    isLoading: isPlayerDataLoading,
    isSuccess: isPlayerDataSuccess,
  } = useContractRead({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "getPlayer",
    args: [smartAccountAddress],
    // watch: pageIsFocused, // I don't think this needs watching, it wont change
    onSettled(data, error) {
      setPlayer(data as Player);
    },
  });

  // Use wagmi useContractWrite to call the contract's inviteToGame function
  // when the invite button is clicked
  const {
    data: inviteData,
    isLoading: isInviteLoading,
    isSuccess: isInviteSuccess,
    write: invite,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "inviteToGame",
  });

  function renderInviteForm() {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <label>
            Invite a Player by Address:
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter an address"
            />
          </label>
          <button type="submit">Submit</button>
        </form>
        {renderJoinOrCreateRandomGameButton()}
        <form
          onSubmit={handleFreeInviteSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <label>
            Invite a New Player to Free Game:
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter an address"
            />
          </label>
          <button type="submit">Request Free Game</button>
        </form>
      </div>
    );
  }

  function renderJoinOrCreateRandomGameButton() {
    return (
      <button
        onClick={() => createOrJoinRandomGame({ value: debug_game_cost })}
      >
        Create or Join Random Game
      </button>
    );
  }

  function renderAcceptButton(game: Game) {
    if (game.free) {
    }
  }

  function renderJoinButton(game: Game) {
    if (!player || !player.inviteIds || !player.inviteIds.includes(game.id)) {
      return null;
    }
    if (game.player2Address === "0x0000000000000000000000000000000000000000") {
      return <div>Waiting for a player to join...</div>;
    }
    if (game.status !== Status.NotStarted) {
      return null;
    }
    return (
      <div>
        <button onClick={() => handleRejectButtonClick(game.id)}>
          Reject Invite
        </button>
        <button onClick={() => handleAcceptButtonClick(game.id)}>
          Accept Invite
        </button>
        <button onClick={() => handleAcceptForFreeButtonClick(game.id)}>
          Accept Free
        </button>
      </div>
    );
  }

  function renderGoToGameButton(game: Game) {
    if (game.status === Status.NotStarted) {
      return null;
    }
    return (
      <div>
        <button onClick={() => handleGoToGame(game.id)}>Go to Game</button>
      </div>
    );
  }

  function renderGameData() {
    if (!isMounted) {
      return null;
    }

    if (isGamesDataLoading) {
      return <div>Loading...</div>;
    }

    if (isGamesDataError) {
      return <div>Error loading games</div>;
    }

    if (isGamesDataSuccess) {
      if (!games || games.length === 0) {
        return <div>No games found</div>;
      } else {
        return (
          <div>
            <h2>Games List</h2>
            <ul>
              {games.map((game) => (
                <li key={game.id.toString()}>
                  {game.currentPlayer === smartAccountAddress &&
                  game.status === Status.Active ? (
                    <div style={{ color: "yellow" }}>Your Turn</div>
                  ) : null}
                  <div>Status: {Status[game.status]}</div>
                  <div>Game ID: {game.id.toString()}</div>
                  <div>Player 1: {game.player1Address}</div>
                  <div>Player 2: {game.player2Address}</div>
                  <div>Value: {game.value.toString()}</div>
                  <div>Current Player: {game.currentPlayer}</div>
                  {renderJoinButton(game)}
                  {renderGoToGameButton(game)}
                  <hr />
                </li>
              ))}
            </ul>
          </div>
        );
      }
    }
  }

  if (ready && authenticated) {
    return (
      <div>
        {renderInviteForm()}
        {renderGameData()}
      </div>
    );
  } else if (ready && !authenticated) {
    return <div>Please log in to view games</div>;
  } else {
    return <div>Loading...</div>;
  }
};

export default GameList;
