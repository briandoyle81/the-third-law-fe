// components/GameBoard.tsx
import React from "react";
import { Game, Mine, Ship, Torpedo } from "./gameList";
import { useAccount, useContractRead } from "wagmi";

import TheThirdLaw from "../deployments/TheThirdLaw.json";
import { useIsMounted } from "../utils/useIsMounted";

import ControlPanel from "./controlPanel";

const BOARD_SIZE = 101;
const START_INDEX = -50;
const END_INDEX = 50;
const ASTEROID_SIZE = 20;

const containerStyle: React.CSSProperties = {
  display: "flex",
};

const blackSquareStyle: React.CSSProperties = {
  width: "10px",
  height: "10px",
  // border: "1px solid white",
  backgroundColor: "black",
  display: "inline-block",
};

const graySquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "gray",
};

const player1ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "red",
};

const player2ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "blue",
};

const outlinedPlayer1ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  border: "1px solid red",
};

const outlinedPlayer2ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  border: "1px solid blue",
};

const mineStyle: React.CSSProperties = {
  ...blackSquareStyle,
  borderRadius: "50%", // Makes the square a circle
};

const torpedoStyle: React.CSSProperties = {
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", // Makes the square a triangle
};

const rowStyle: React.CSSProperties = {
  display: "flex",
};

const getOutlinedTorpedoStyle = (color: string): React.CSSProperties => ({
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
  border: `1px solid ${color}`,
});

const manhattanDistance = (
  x1: number,
  y1: number,
  x2: number = 0,
  y2: number = 0
): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

interface GameBoardProps {
  gameId: BigInt;
  setGameId: Function;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, setGameId }) => {
  const [game, setGame] = React.useState<Game>();

  const { address } = useAccount();

  const {
    data: gameData,
    isError: isGameError,
    isLoading: isGameLoading,
    isSuccess: isGameSuccess,
  } = useContractRead({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "getGame",
    args: [gameId],
    watch: true,
    onSettled(data, error) {
      setGame(data as Game);
    },
  });

  const isSquareShipPosition = (
    row: number,
    col: number,
    ship: Ship | undefined
  ): boolean => {
    return (
      !!ship &&
      Number(ship.position.row) === row &&
      Number(ship.position.col) === col
    );
  };

  const isSquareShipNextPosition = (
    row: number,
    col: number,
    ship: Ship | undefined
  ): boolean => {
    return (
      !!ship &&
      Number(ship.position.row) + Number(ship.velocity.row) === row &&
      Number(ship.position.col) + Number(ship.velocity.col) === col
    );
  };

  const isSquareMinePosition = (
    row: number,
    col: number,
    mines: Mine[] | undefined
  ): boolean => {
    return (
      !!mines &&
      mines.some(
        (mine) =>
          Number(mine.position.row) === row && Number(mine.position.col) === col
      )
    );
  };

  const isSquareTorpedoPosition = (
    row: number,
    col: number,
    torpedoes: Torpedo[] | undefined
  ): boolean => {
    return (
      !!torpedoes &&
      torpedoes.some(
        (torpedo) =>
          Number(torpedo.position.row) === row &&
          Number(torpedo.position.col) === col
      )
    );
  };

  const isSquareTorpedoNextPosition = (
    row: number,
    col: number,
    torpedoes: Torpedo[] | undefined
  ): boolean => {
    return (
      !!torpedoes &&
      torpedoes.some(
        (torpedo) =>
          Number(torpedo.position.row) + Number(torpedo.velocity.row) === row &&
          Number(torpedo.position.col) + Number(torpedo.velocity.col) === col
      )
    );
  };

  return (
    <div style={containerStyle}>
      <div>
        {[...Array(BOARD_SIZE)].map((_, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {[...Array(BOARD_SIZE)].map((_, colIndex) => {
              const currentRow = START_INDEX + rowIndex;
              const currentCol = START_INDEX + colIndex;
              const distance = manhattanDistance(currentRow, currentCol);

              let squareStyle =
                distance <= ASTEROID_SIZE ? graySquareStyle : blackSquareStyle;

              if (
                isSquareShipPosition(currentRow, currentCol, game?.player1Ship)
              ) {
                squareStyle = player1ShipStyle;
              } else if (
                isSquareShipPosition(currentRow, currentCol, game?.player2Ship)
              ) {
                squareStyle = player2ShipStyle;
              } else if (
                isSquareShipNextPosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship
                )
              ) {
                squareStyle = outlinedPlayer1ShipStyle;
              } else if (
                isSquareShipNextPosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship
                )
              ) {
                squareStyle = outlinedPlayer2ShipStyle;
              } else if (
                isSquareMinePosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.mines
                )
              ) {
                squareStyle = { ...mineStyle, backgroundColor: "red" };
              } else if (
                isSquareMinePosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.mines
                )
              ) {
                squareStyle = { ...mineStyle, backgroundColor: "blue" };
              } else if (
                isSquareTorpedoPosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.torpedoes
                )
              ) {
                squareStyle = { ...torpedoStyle, backgroundColor: "red" };
              } else if (
                isSquareTorpedoPosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.torpedoes
                )
              ) {
                squareStyle = { ...torpedoStyle, backgroundColor: "blue" };
              }
              // Check for torpedo's next position for player 1
              else if (
                isSquareTorpedoNextPosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.torpedoes
                )
              ) {
                squareStyle = getOutlinedTorpedoStyle("red");
              }
              // Check for torpedo's next position for player 2
              else if (
                isSquareTorpedoNextPosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.torpedoes
                )
              ) {
                squareStyle = getOutlinedTorpedoStyle("blue");
              }

              return (
                <div
                  key={colIndex}
                  style={squareStyle}
                  title={`Row: ${currentRow}, Col: ${currentCol}, Distance: ${distance}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {game && game.currentPlayer === address && (
        <ControlPanel
          game={game}
          ship={game?.player1Ship} // Assuming it's player1's turn. Adjust accordingly.
          isCurrentPlayer={true} // Adjust based on your game logic
          onAction={(action) => {
            // Handle the player's action here
          }}
        />
      )}
    </div>
  );
};

export default GameBoard;
