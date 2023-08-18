import React, { useState } from "react";
import { Game, Ship } from "./gameList";

import { useContractWrite } from "wagmi";

import TheThirdLaw from "../deployments/TheThirdLaw.json";

export enum Action {
  None,
  FireTorpedo,
  DropMine,
}

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

export const statusToString = (status: Status): string => {
  switch (status) {
    case Status.NotStarted:
      return "Not Started";
    case Status.Player1Destroyed:
      return "Player 1 Destroyed";
    case Status.Player2Destroyed:
      return "Player 2 Destroyed";
    case Status.Player1Fled:
      return "Player 1 Fled";
    case Status.Player2Fled:
      return "Player 2 Fled";
    case Status.Draw:
      return "Draw";
    case Status.Active:
      return "Active";
    case Status.Over:
      return "Over";
    default:
      return "Unknown Status";
  }
};

interface ControlPanelProps {
  game: Game;
  ship?: Ship;
  isCurrentPlayer: boolean;
  onAction: (action: PlayerAction) => void;
}

interface PlayerAction {
  vertical: "up" | "down" | "none";
  horizontal: "left" | "right" | "none";
  deploy: "mine" | "torpedo" | "none";
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  game,
  ship,
  isCurrentPlayer,
  onAction,
}) => {
  const [action, setAction] = useState<PlayerAction>({
    vertical: "none",
    horizontal: "none",
    deploy: "none",
  });

  const {
    data: actionData,
    isError: isActionError,
    isLoading: isActionLoading,
    isSuccess: isActionSuccess,
    write: takeTurn,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "takeTurn",
  });

  // if (!isCurrentPlayer && game.status === Status.Active) {
  //   return null;
  // }

  if (game.status !== Status.Active) {
    return (
      <div>
        <h2>Game Over</h2>
        <p>{statusToString(game.status)}</p>
      </div>
    );
  }

  const handleActionSubmit = () => {
    onAction(action);

    takeTurn({
      args: [
        game.id,
        action.horizontal === "left"
          ? 1
          : action.horizontal === "right"
          ? 2
          : 0,
        action.vertical === "up" ? 1 : action.vertical === "down" ? 2 : 0,
        action.deploy === "mine" ? 2 : action.deploy === "torpedo" ? 1 : 0,
      ],
    });
    // Resetting for the next action (if required)
    setAction({
      vertical: "none",
      horizontal: "none",
      deploy: "none",
    });
  };

  function getColor() {
    if (!ship) {
      return "black";
    } else if (ship.ownerAddress === game.player1Address) {
      return "red";
    } else if (ship.ownerAddress === game.player2Address) {
      return "blue";
    } else {
      return "black";
    }
  }

  return (
    <div>
      <h2
        style={{
          color: getColor(),
        }}
      >
        Control Panel
      </h2>

      <h3>Acceleration</h3>
      <select
        value={action.vertical}
        onChange={(e) =>
          setAction((prev) => ({
            ...prev,
            vertical: e.target.value as "up" | "down" | "none",
          }))
        }
      >
        <option value="none">No Change</option>
        <option value="up">Up</option>
        <option value="down">Down</option>
      </select>

      <select
        value={action.horizontal}
        onChange={(e) =>
          setAction((prev) => ({
            ...prev,
            horizontal: e.target.value as "left" | "right" | "none",
          }))
        }
      >
        <option value="none">No Change</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>

      <h3>Deploy</h3>
      <label>
        <input
          type="radio"
          value="none"
          checked={action.deploy === "none"}
          onChange={() => setAction((prev) => ({ ...prev, deploy: "none" }))}
        />
        None
      </label>
      <label>
        <input
          type="radio"
          value="mine"
          disabled={Number(ship?.remainingMines) <= 0}
          checked={action.deploy === "mine"}
          onChange={() => setAction((prev) => ({ ...prev, deploy: "mine" }))}
        />
        Deploy Mine
      </label>
      <label>
        <input
          type="radio"
          value="torpedo"
          disabled={Number(ship?.remainingTorpedoes) <= 0}
          checked={action.deploy === "torpedo"}
          onChange={() => setAction((prev) => ({ ...prev, deploy: "torpedo" }))}
        />
        Deploy Torpedo
      </label>

      <button onClick={handleActionSubmit}>Execute Action</button>
    </div>
  );
};

export default ControlPanel;
