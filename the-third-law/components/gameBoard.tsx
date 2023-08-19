// components/GameBoard.tsx
import React from "react";
import { Game, Mine, Ship, Torpedo } from "./gameList";
import { useAccount, useContractRead } from "wagmi";

import TheThirdLaw from "../deployments/TheThirdLaw.json";
import { useIsMounted } from "../utils/useIsMounted";

import ControlPanel from "./controlPanel";

// TODO: Get these from the contract
const BOARD_SIZE = 41;
const START_INDEX = -20;
const END_INDEX = 20;
const ASTEROID_SIZE = 10;
const MINE_RANGE = 2;
const TORPEDO_ACCEL = 1;

const containerStyle: React.CSSProperties = {
  display: "flex",
};

const blackSquareStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
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

const darkRedSquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "darkred",
};

const darkBlueSquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "darkblue",
};

const torpedoStyle: React.CSSProperties = {
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)", // Makes the square a diamond
};

const rowStyle: React.CSSProperties = {
  display: "flex",
};

const getOutlinedTorpedoStyle = (color: string): React.CSSProperties => ({
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)", // Makes the shape a diamond
  border: `4px solid ${color}`,
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

// Const move this when decomposing this component
const blinkingTorpedoStyle: React.CSSProperties = {
  ...torpedoStyle,
  animation: "blink 1s linear infinite",
  // ... other styles you want
};

const blinkingOutlineStyle: React.CSSProperties = {
  ...blackSquareStyle,
  animation: "blink 1s linear infinite",
  // ... other styles you want
};

const blinkKeyframes = `
@keyframes blink {
  0% {opacity: 1;}
  50% {opacity: 0.5;}
  100% {opacity: 1;}
}
`;

const BlinkingTorpedoStyle: React.FC = () => {
  return <style>{blinkKeyframes}</style>;
};

const BlinkingOutlineStyle: React.FC = () => {
  return <style>{blinkKeyframes}</style>;
};

const GameBoard: React.FC<GameBoardProps> = ({ gameId, setGameId }) => {
  const [game, setGame] = React.useState<Game>();
  const [hoveredMine, setHoveredMine] = React.useState<Mine | null>(null);

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
          Number(torpedo.position.col) === col &&
          Number(torpedo.remainingFuel) > 0
      )
    );
  };

  const isSquareTorpedoHittingShip = (
    row: number,
    col: number,
    torpedoes: Torpedo[] | undefined,
    ship: Ship | undefined
  ): boolean => {
    return (
      !!torpedoes &&
      !!ship &&
      torpedoes.some(
        (torpedo) =>
          Number(torpedo.position.row) === row &&
          Number(torpedo.position.col) === col &&
          Number(torpedo.remainingFuel) > 0 &&
          Number(ship.position.row) === row &&
          Number(ship.position.col) === col
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
          Number(torpedo.position.col) + Number(torpedo.velocity.col) === col &&
          Number(torpedo.remainingFuel) > 0
      )
    );
  };

  const isSquareWithinMineEffectRange = (
    row: number,
    col: number,
    mine: Mine | null
  ): boolean => {
    return !!(
      mine &&
      manhattanDistance(
        row,
        col,
        Number(mine.position.row),
        Number(mine.position.col)
      ) <= MINE_RANGE
    );
  };

  const isSquareWithinTorpedoEffectRange = (
    row: number,
    col: number,
    torpedoes: Torpedo[] | undefined
  ): boolean => {
    if (!torpedoes) return false;

    return torpedoes.some((torpedo) => {
      if (Number(torpedo.remainingFuel) <= 0) {
        return false;
      }

      const effectStartRow =
        Number(torpedo.position.row) +
        Number(torpedo.velocity.row) -
        TORPEDO_ACCEL;
      const effectEndRow =
        Number(torpedo.position.row) +
        Number(torpedo.velocity.row) +
        TORPEDO_ACCEL;
      const effectStartCol =
        Number(torpedo.position.col) +
        Number(torpedo.velocity.col) -
        TORPEDO_ACCEL;
      const effectEndCol =
        Number(torpedo.position.col) +
        Number(torpedo.velocity.col) +
        TORPEDO_ACCEL;

      return (
        row >= effectStartRow &&
        row <= effectEndRow &&
        col >= effectStartCol &&
        col <= effectEndCol
      );
    });
  };

  const isTorpedoEffectSquareInRangeOfShip = (
    row: number,
    col: number,
    ship: Ship | undefined
  ): boolean => {
    if (!ship) return false;

    const effectStartRow = Number(ship.position.row) - TORPEDO_ACCEL;
    const effectEndRow = Number(ship.position.row) + TORPEDO_ACCEL;
    const effectStartCol = Number(ship.position.col) - TORPEDO_ACCEL;
    const effectEndCol = Number(ship.position.col) + TORPEDO_ACCEL;

    return (
      row >= effectStartRow &&
      row <= effectEndRow &&
      col >= effectStartCol &&
      col <= effectEndCol
    );
  };

  const willTorpedoHitOrBeCloseToShip = (
    torpedo: Torpedo,
    enemyShipPosition: { row: number; col: number }
  ): boolean => {
    const nextTorpedoRow =
      Number(torpedo.position.row) + Number(torpedo.velocity.row);
    const nextTorpedoCol =
      Number(torpedo.position.col) + Number(torpedo.velocity.col);

    return (
      Math.abs(nextTorpedoRow - enemyShipPosition.row) <= TORPEDO_ACCEL &&
      Math.abs(nextTorpedoCol - enemyShipPosition.col) <= TORPEDO_ACCEL
    );
  };

  const getCurrentPlayerShip = (): Ship | undefined => {
    if (!game) {
      return undefined;
    }

    if (game.currentPlayer === game.player1Address) {
      return game.player1Ship;
    } else if (game.currentPlayer === game.player2Address) {
      return game.player2Ship;
    } else {
      return undefined;
    }
  };

  return (
    <div style={containerStyle}>
      <BlinkingTorpedoStyle />
      <BlinkingOutlineStyle />
      <div>
        {[...Array(BOARD_SIZE)].map((_, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {[...Array(BOARD_SIZE)].map((_, colIndex) => {
              let backgroundSquareStyle = blackSquareStyle;
              // Determine if it's an enemy torpedo that is close to or on top of our ship
              // TODO: This should probably be renamed to close to 1 or 2
              const enemyTorpedoCloseToUs = game?.player1Ship?.torpedoes?.some(
                (torpedo) =>
                  willTorpedoHitOrBeCloseToShip(torpedo, {
                    row: Number(game?.player2Ship?.position.row),
                    col: Number(game?.player2Ship?.position.col),
                  })
              );

              const ourTorpedoCloseToEnemy = game?.player2Ship?.torpedoes?.some(
                (torpedo) =>
                  willTorpedoHitOrBeCloseToShip(torpedo, {
                    row: Number(game?.player1Ship?.position.row),
                    col: Number(game?.player1Ship?.position.col),
                  })
              );

              const currentRow = START_INDEX + rowIndex;
              const currentCol = START_INDEX + colIndex;
              const distance = manhattanDistance(currentRow, currentCol);

              let squareStyle =
                distance <= ASTEROID_SIZE ? graySquareStyle : blackSquareStyle;

              if (
                isSquareShipPosition(currentRow, currentCol, game?.player1Ship)
              ) {
                if (
                  isSquareTorpedoHittingShip(
                    currentRow,
                    currentCol,
                    game?.player2Ship?.torpedoes,
                    game?.player1Ship
                  )
                ) {
                  backgroundSquareStyle = player1ShipStyle;
                  squareStyle = {
                    ...torpedoStyle,
                    backgroundColor: "blue",
                  };
                } else {
                  squareStyle = player1ShipStyle;
                }
              } else if (
                isSquareShipPosition(currentRow, currentCol, game?.player2Ship)
              ) {
                if (
                  isSquareTorpedoHittingShip(
                    currentRow,
                    currentCol,
                    game?.player1Ship?.torpedoes,
                    game?.player2Ship
                  )
                ) {
                  backgroundSquareStyle = player2ShipStyle;
                  squareStyle = {
                    ...torpedoStyle,
                    backgroundColor: "red",
                  };
                } else {
                  squareStyle = player2ShipStyle;
                }
              } else if (
                isSquareTorpedoPosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.torpedoes
                )
              ) {
                squareStyle = enemyTorpedoCloseToUs
                  ? { ...blinkingTorpedoStyle, backgroundColor: "red" }
                  : { ...torpedoStyle, backgroundColor: "red" };
              } else if (
                isSquareTorpedoPosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.torpedoes
                )
              ) {
                squareStyle = ourTorpedoCloseToEnemy
                  ? { ...blinkingTorpedoStyle, backgroundColor: "blue" }
                  : { ...torpedoStyle, backgroundColor: "blue" };
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
                return (
                  <div
                    key={colIndex}
                    style={squareStyle}
                    onMouseEnter={() =>
                      setHoveredMine({
                        position: {
                          row: BigInt(currentRow),
                          col: BigInt(currentCol),
                        },
                        color: "red",
                      })
                    }
                    onMouseLeave={() => setHoveredMine(null)}
                  />
                );
              } else if (
                isSquareMinePosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.mines
                )
              ) {
                squareStyle = { ...mineStyle, backgroundColor: "blue" };
                return (
                  <div
                    key={colIndex}
                    style={squareStyle}
                    onMouseEnter={() =>
                      setHoveredMine({
                        position: {
                          row: BigInt(currentRow),
                          col: BigInt(currentCol),
                        },
                        color: "blue",
                      })
                    }
                    onMouseLeave={() => setHoveredMine(null)}
                  />
                );
              } else if (
                isSquareTorpedoNextPosition(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.torpedoes
                )
              ) {
                squareStyle = getOutlinedTorpedoStyle("red");
              } else if (
                isSquareTorpedoNextPosition(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.torpedoes
                )
              ) {
                squareStyle = getOutlinedTorpedoStyle("blue");
              } else if (
                isSquareWithinMineEffectRange(
                  currentRow,
                  currentCol,
                  hoveredMine
                )
              ) {
                squareStyle =
                  hoveredMine?.color === "red"
                    ? darkRedSquareStyle
                    : darkBlueSquareStyle;
              } else if (
                isSquareWithinTorpedoEffectRange(
                  currentRow,
                  currentCol,
                  game?.player1Ship?.torpedoes
                )
              ) {
                if (
                  isTorpedoEffectSquareInRangeOfShip(
                    currentRow,
                    currentCol,
                    game?.player2Ship
                  )
                ) {
                  squareStyle = {
                    ...blinkingOutlineStyle,
                    border: "1px dashed red",
                  }; // apply the desired style
                } else {
                  squareStyle = { ...squareStyle, border: "1px dashed red" }; // apply the desired style
                }
              } else if (
                isSquareWithinTorpedoEffectRange(
                  currentRow,
                  currentCol,
                  game?.player2Ship?.torpedoes
                )
              ) {
                if (
                  isTorpedoEffectSquareInRangeOfShip(
                    currentRow,
                    currentCol,
                    game?.player2Ship
                  )
                ) {
                  squareStyle = {
                    ...blinkingOutlineStyle,
                    border: "1px dashed blue",
                  }; // apply the desired style
                } else {
                  squareStyle = { ...squareStyle, border: "1px dashed blue" }; // apply the desired style
                }
              }

              return (
                <div key={colIndex} style={backgroundSquareStyle}>
                  <div
                    style={squareStyle}
                    title={`Row: ${currentRow}, Col: ${currentCol}, Distance: ${distance}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {game && (
        <ControlPanel
          game={game}
          ship={getCurrentPlayerShip()}
          localPlayerTurn={game.currentPlayer === address}
          onAction={(action) => {
            // Handle the player's action here
          }}
        />
      )}
    </div>
  );
};

export default GameBoard;
