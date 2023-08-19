// components/GameDescription.tsx

import React from "react";

const GameDescription: React.FC = () => {
  return (
    <div>
      <h2>The Third Law</h2>
      <p>
        The Third Law is a retro-inspired, pvp, space-ship game. Fight your
        opponent over control of a valuable asteroid.
      </p>
      <p>You&apos;ll need Eth on Base (or currently Base Goerli) to play.</p>
      <p>
        To start a game, invite your opponent to the game by pasting their
        address into the field on the Games tab and paying the fee. Warning: to
        prevent spam, your fee will be forfeited if your opponent rejects the
        game!
      </p>
      <p>Once they accept, click the button to go to the game.</p>
      <p>
        The game is played in a field of space with an asteroid at the center.
        Each player is in a spaceship, represented by 🟥 and 🟦. You can&apos;t
        move your ship directly. Instead, each turn you can choose to thrust up
        or down, and left or right. Doing so will change your ship&apos;s
        velocity.
      </p>
      <p>
        Once the ships start moving, you&apos;ll see an outline of where the
        ship will move to on that player&apos;s next turn - unless they thrust.
      </p>
      <h3>Your Goal</h3>
      <p>
        Your goal is to destroy your opponent before they destroy you. You can
        accomplish your goal in one of three ways.
      </p>
      <ul>
        <li>Hit them with a torpedo 🔷</li>
        <li>Lure them into a mine 🔵</li>
        <li>Cause enough panic they crash into the asteroid</li>
      </ul>
      <p>
        You may fire one torpedo or lay one mine per turn. Torpedoes track
        toward your enemy, but must move to a close distance to hit. If
        they&apos;re going too fast they may miss! Torpedoes are active for a
        limited amount of time before they run out of fuel and go inert. You can
        also see approximately where each torpedo will move.
      </p>
      <p>Mines stay stationary but don&apos;t run out of fuel.</p>
      <p>
        If you or your opponent leaves the game area by running of the edge, the
        player still remaining will score a partial win.
      </p>
    </div>
  );
};

export default GameDescription;
