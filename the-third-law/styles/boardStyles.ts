export const containerStyle: React.CSSProperties = {
  display: "flex",
};

export const blackSquareStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  // border: "1px solid white",
  backgroundColor: "black",
  display: "inline-block",
};

export const graySquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "gray",
};

export const player1ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "red",
};

export const player2ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "blue",
};

export const outlinedPlayer1ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  border: "1px solid red",
};

export const outlinedPlayer2ShipStyle: React.CSSProperties = {
  ...blackSquareStyle,
  border: "1px solid blue",
};

export const mineStyle: React.CSSProperties = {
  ...blackSquareStyle,
  borderRadius: "50%", // Makes the square a circle
};

export const darkRedSquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "darkred",
};

export const darkBlueSquareStyle: React.CSSProperties = {
  ...blackSquareStyle,
  backgroundColor: "darkblue",
};

export const torpedoStyle: React.CSSProperties = {
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)", // Makes the square a diamond
};

export const rowStyle: React.CSSProperties = {
  display: "flex",
};

export const getOutlinedTorpedoStyle = (
  color: string
): React.CSSProperties => ({
  ...blackSquareStyle,
  clipPath: "polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)", // Makes the shape a diamond
  border: `4px solid ${color}`,
});

// Const move this when decomposing this component
export const blinkingTorpedoStyle: React.CSSProperties = {
  ...torpedoStyle,
  animation: "blink 1s linear infinite",
  // ... other styles you want
};

export const blinkingOutlineStyle: React.CSSProperties = {
  ...blackSquareStyle,
  animation: "blink 1s linear infinite",
  // ... other styles you want
};

export const blinkKeyframes = `
@keyframes blink {
  0% {opacity: 1;}
  50% {opacity: 0.5;}
  100% {opacity: 1;}
}
`;
