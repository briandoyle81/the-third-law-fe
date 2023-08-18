import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

import { useAccount, useContractRead, useContractWrite } from "wagmi";

import TheThirdLaw from "../deployments/TheThirdLaw.json";
import { useIsMounted } from "../utils/useIsMounted";
import { parseEther } from "viem";

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
  gameIds: BigInt[];
  inviteIds: BigInt[];
  victories: BigInt; // Enemy was destroyed
  defaultVictories: BigInt; // Enemy was forced to flee
  defaultLosses: BigInt; // Player was forced to flee
  draws: BigInt; // Both players ran out of weapons
  losses: BigInt; // Player was destroyed
  eloRating: BigInt;
  currentShipId: BigInt;
};

export type Vector2 = {
  row: BigInt;
  col: BigInt;
};

export type Torpedo = {
  position: Vector2;
  velocity: Vector2;
  remainingFuel: BigInt;
};

export type Mine = {
  position: Vector2;
  color?: string;
};

export type Ship = {
  ownerAddress: string;
  position: Vector2;
  velocity: Vector2;
  remainingTorpedoes: BigInt;
  remainingMines: BigInt;
  torpedoes: Torpedo[];
  mines: Mine[];
};

export type Game = {
  id: BigInt;
  player1Address: string;
  player2Address: string;
  player1Ship: Ship;
  player2Ship: Ship;
  status: Status;
  value: BigInt; // Amount to be paid to victor, or split if there is a tie
  currentPlayer: string; // Set to None if game not started or is over
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

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    invite({ args: [address], value: debug_game_cost });
    setAddress(""); // Reset the input field after submission
  };

  function handleAcceptButtonClick(gameId: BigInt) {
    acceptInvite({ args: [gameId], value: debug_game_cost });
  }

  function handleRejectButtonClick(gameId: BigInt) {
    rejectInvite({ args: [gameId] });
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
    data: gamesData,
    isError: isGamesDataError,
    isLoading: isGamesDataLoading,
    isSuccess: isGamesDataSuccess,
  } = useContractRead({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "getGamesForPlayer",
    args: [useAccount()?.address],
    watch: true,
    onSettled(data, error) {
      setGames(data as Game[]);
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
    args: [useAccount()?.address],
    watch: true,
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
      <form onSubmit={handleSubmit}>
        <label>
          Address to Invite:
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter an address"
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    );
  }

  function renderJoinButton(game: Game) {
    if (!player || !player.inviteIds || !player.inviteIds.includes(game.id)) {
      return null;
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
                  <div>Game ID: {game.id.toString()}</div>
                  <div>Player 1: {game.player1Address}</div>
                  <div>Player 2: {game.player2Address}</div>
                  <div>Value: {game.value.toString()}</div>
                  <div>Status: {Status[game.status]}</div>
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

  return (
    <div>
      {renderInviteForm()}
      {renderGameData()}
    </div>
  );
};

export default GameList;
