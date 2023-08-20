import React, { useEffect, useState } from "react";
import { Game, Ship, Vector2 } from "./gameList";

import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";

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
  localPlayerTurn: boolean;
  localPlayerAddress: string;
  input: Vector2;
  setInput: Function;
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
  localPlayerTurn,
  localPlayerAddress,
  input,
  setInput,
  onAction,
}) => {
  const [action, setAction] = useState<PlayerAction>({
    vertical: "none",
    horizontal: "none",
    deploy: "none",
  });
  const [newInput, setNewInput] = useState<Vector2>({
    row: BigInt(0),
    col: BigInt(0),
  });

  const {
    data: actionData,
    isError: isActionError,
    isLoading: isActionLoading,
    isSuccess: isActionSuccess,
    write: takeTurn,
    reset: resetAction,
  } = useContractWrite({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "takeTurn",
  });

  const { data: actionReceiptData, isLoading: isActionReceiptLoading } =
    useWaitForTransaction({
      hash: actionData?.hash,
    });

  useEffect(() => {
    if (actionReceiptData) {
      // Wait 4 seconds before calling resetAction and resetting the action
      setTimeout(() => {
        resetAction();
        // Resetting for the next action (if required)
        setAction({
          vertical: "none",
          horizontal: "none",
          deploy: "none",
        });

        setNewInput({ row: BigInt(0), col: BigInt(0) }); // Reset newInput state
        setInput({ row: BigInt(0), col: BigInt(0) }); // Reset input state
      }, 2000);
    }
  }, [actionReceiptData, resetAction]);

  if (localPlayerTurn && isActionReceiptLoading) {
    return (
      <div>
        <h2
          style={{
            color: getColor(),
          }}
        >
          Processing Command
        </h2>
      </div>
    );
  }

  if (!localPlayerTurn && game.status === Status.Active) {
    return (
      <div>
        <h2
          style={{
            color: getColor(),
          }}
        >
          Waiting for Opponent
        </h2>
      </div>
    );
  }

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
  };

  function getColor() {
    if (!ship) {
      return "black";
    } else if (localPlayerAddress === game.player1Address) {
      return "red";
    } else if (localPlayerAddress === game.player2Address) {
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
        onChange={(e) => {
          const direction = e.target.value as "up" | "down" | "none";
          let updatedInput;
          if (direction === "up") {
            updatedInput = { row: BigInt(-1), col: newInput.col };
          } else if (direction === "down") {
            updatedInput = { row: BigInt(1), col: newInput.col };
          } else {
            updatedInput = { row: BigInt(0), col: newInput.col };
          }
          setNewInput(updatedInput); // Update newInput state
          setInput(updatedInput); // Directly use the updated value
          setAction((prev) => ({
            ...prev,
            vertical: direction,
          }));
        }}
      >
        <option value="none">No Change</option>
        <option value="up">Up</option>
        <option value="down">Down</option>
      </select>

      <select
        value={action.horizontal}
        onChange={(e) => {
          const direction = e.target.value as "left" | "right" | "none";
          let updatedInput;
          if (direction === "left") {
            updatedInput = { row: newInput.row, col: BigInt(-1) };
          } else if (direction === "right") {
            updatedInput = { row: newInput.row, col: BigInt(1) };
          } else {
            updatedInput = { row: newInput.row, col: BigInt(0) };
          }
          setNewInput(updatedInput); // Update newInput state
          setInput(updatedInput); // Directly use the updated value
          setAction((prev) => ({
            ...prev,
            horizontal: direction,
          }));
        }}
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
